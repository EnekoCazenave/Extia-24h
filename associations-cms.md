# Plan : Page Associations avec CMS par blocs

## Contexte

Ajouter une page publique `/associations` presentant les associations caritatives beneficiaires de l'evenement. Chaque association = un onglet. Tout le contenu est gere via un CMS par blocs cote admin.

- **Frontend** : React 18 + Vite + react-router-dom + TanStack React Query + CSS Modules
- **Backend** : Fastify + Prisma (PostgreSQL) + Zod
- **Pattern** : shared schemas Zod -> routes -> controllers -> services -> Prisma

---

## Choix de conception valides par l'utilisateur

- **Type de contenu** : Blocs de contenu structures (titre, texte, image, video, citation, CTA, barre de progression, lien don)
- **Collecte/dons** : Presentation + barre de progression manuelle + lien vers don externe
- **Navigation** : Lien "Associations" dans le menu principal (header)

---

## Etape 1 : Schema Prisma

**Fichier** : `packages/server/prisma/schema.prisma`

Ajouter a la fin du fichier, apres le modele `RefreshToken` :

```prisma
// CMS — Associations caritatives

enum BlockType {
  HEADING
  TEXT
  IMAGE
  VIDEO
  CTA_BUTTON
  PROGRESS_BAR
  DONATION_LINK
  QUOTE
}

model Association {
  id        Int                @id @default(autoincrement())
  name      String
  slug      String             @unique
  logoUrl   String?
  published Boolean            @default(false)
  sortOrder Int                @default(0)
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt
  blocks    AssociationBlock[]
}

model AssociationBlock {
  id            Int         @id @default(autoincrement())
  association   Association @relation(fields: [associationId], references: [id], onDelete: Cascade)
  associationId Int
  type          BlockType
  sortOrder     Int         @default(0)
  content       Json
}
```

Le champ `content` (Json) stocke des donnees flexibles selon le `BlockType` :

| BlockType      | Structure content                                             |
|----------------|---------------------------------------------------------------|
| HEADING        | `{ text: string, level: 1 \| 2 \| 3 }`                      |
| TEXT           | `{ html: string }`                                            |
| IMAGE          | `{ url: string, alt: string, caption?: string }`              |
| VIDEO          | `{ url: string, provider: "youtube" \| "twitch" \| "custom" }` |
| CTA_BUTTON     | `{ label: string, url: string, style: "primary" \| "secondary" }` |
| PROGRESS_BAR   | `{ current: number, goal: number, label?: string, unit?: string }` |
| DONATION_LINK  | `{ label: string, url: string }`                              |
| QUOTE          | `{ text: string, author?: string }`                           |

---

## Etape 2 : Migration Prisma

```bash
cd packages/server
npx prisma migrate dev --name add_associations_cms
```

---

## Etape 3 : Schemas Zod partages

**Nouveau fichier** : `packages/shared/src/schemas/association.schema.ts`

```ts
import { z } from 'zod'

// ── BlockType enum ──
export const BlockTypeEnum = z.enum([
  'HEADING', 'TEXT', 'IMAGE', 'VIDEO',
  'CTA_BUTTON', 'PROGRESS_BAR', 'DONATION_LINK', 'QUOTE',
])
export type BlockType = z.infer<typeof BlockTypeEnum>

// ── Content schemas per block type ──
export const HeadingContentSchema = z.object({
  text: z.string().min(1).max(500),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
})

export const TextContentSchema = z.object({
  html: z.string().min(1).max(50000),
})

export const ImageContentSchema = z.object({
  url: z.string().min(1),
  alt: z.string().max(500).default(''),
  caption: z.string().max(500).optional(),
})

export const VideoContentSchema = z.object({
  url: z.string().min(1),
  provider: z.enum(['youtube', 'twitch', 'custom']),
})

export const CtaButtonContentSchema = z.object({
  label: z.string().min(1).max(100),
  url: z.string().min(1),
  style: z.enum(['primary', 'secondary']).default('primary'),
})

export const ProgressBarContentSchema = z.object({
  current: z.number().min(0),
  goal: z.number().min(1),
  label: z.string().max(200).optional(),
  unit: z.string().max(20).optional(),
})

export const DonationLinkContentSchema = z.object({
  label: z.string().min(1).max(100),
  url: z.string().min(1),
})

export const QuoteContentSchema = z.object({
  text: z.string().min(1).max(2000),
  author: z.string().max(200).optional(),
})

// ── Map type -> content schema ──
export const BlockContentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('HEADING'), content: HeadingContentSchema }),
  z.object({ type: z.literal('TEXT'), content: TextContentSchema }),
  z.object({ type: z.literal('IMAGE'), content: ImageContentSchema }),
  z.object({ type: z.literal('VIDEO'), content: VideoContentSchema }),
  z.object({ type: z.literal('CTA_BUTTON'), content: CtaButtonContentSchema }),
  z.object({ type: z.literal('PROGRESS_BAR'), content: ProgressBarContentSchema }),
  z.object({ type: z.literal('DONATION_LINK'), content: DonationLinkContentSchema }),
  z.object({ type: z.literal('QUOTE'), content: QuoteContentSchema }),
])

// ── Association CRUD schemas ──
export const CreateAssociationSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  logoUrl: z.string().min(1).optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export const UpdateAssociationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  logoUrl: z.string().min(1).nullable().optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

// ── Block CRUD schemas ──
export const CreateBlockSchema = z.object({
  type: BlockTypeEnum,
  sortOrder: z.number().int().min(0).optional(),
  content: z.record(z.unknown()),
})

export const UpdateBlockSchema = z.object({
  type: BlockTypeEnum.optional(),
  sortOrder: z.number().int().min(0).optional(),
  content: z.record(z.unknown()).optional(),
})

export const ReorderBlocksSchema = z.object({
  blockIds: z.array(z.number().int().positive()),
})

// ── Inferred types ──
export type CreateAssociationInput = z.infer<typeof CreateAssociationSchema>
export type UpdateAssociationInput = z.infer<typeof UpdateAssociationSchema>
export type CreateBlockInput = z.infer<typeof CreateBlockSchema>
export type UpdateBlockInput = z.infer<typeof UpdateBlockSchema>
export type ReorderBlocksInput = z.infer<typeof ReorderBlocksSchema>
```

**Modifier** : `packages/shared/src/schemas/index.ts` — ajouter :

```ts
export * from './association.schema.js'
```

---

## Etape 4 : Backend — Service association

**Nouveau fichier** : `packages/server/src/services/association.service.ts`

Fonctions a implementer :

```ts
// ── Public ──
listPublishedAssociations()
  // SELECT * FROM Association WHERE published = true ORDER BY sortOrder, include blocks ORDER BY sortOrder

getAssociationBySlug(slug: string)
  // findUnique by slug, include blocks ORDER BY sortOrder, throw if not found or not published

// ── Admin ──
listAllAssociations()
  // SELECT * ORDER BY sortOrder, include _count of blocks

createAssociation(data: CreateAssociationInput)
  // auto-generate slug from name if not provided (slugify: lowercase, replace spaces with hyphens, remove special chars)
  // prisma.association.create

updateAssociation(id: number, data: UpdateAssociationInput)
  // findUnique, throw ASSOCIATION_NOT_FOUND if missing
  // prisma.association.update

deleteAssociation(id: number)
  // prisma.association.delete (cascade deletes blocks)

// ── Blocks ──
createBlock(associationId: number, data: CreateBlockInput)
  // validate content against BlockContentSchema discriminated union
  // auto-set sortOrder to max+1 if not provided
  // prisma.associationBlock.create

updateBlock(associationId: number, blockId: number, data: UpdateBlockInput)
  // find block, verify belongs to association
  // validate content if provided
  // prisma.associationBlock.update

deleteBlock(associationId: number, blockId: number)
  // find block, verify belongs to association
  // prisma.associationBlock.delete

reorderBlocks(associationId: number, data: ReorderBlocksInput)
  // transaction: update sortOrder for each blockId based on array index position
```

---

## Etape 5 : Backend — Controller association

**Nouveau fichier** : `packages/server/src/controllers/association.controller.ts`

Suit le meme pattern que `admin.controller.ts` :

```ts
// Public handlers
handleListPublishedAssociations(request, reply)    // -> 200 { associations }
handleGetAssociationBySlug(request, reply)          // -> 200 { association } | 404

// Admin handlers
handleListAllAssociations(request, reply)           // -> 200 { associations }
handleCreateAssociation(request, reply)             // -> 201 { association }
handleUpdateAssociation(request, reply)             // -> 200 { association } | 404
handleDeleteAssociation(request, reply)             // -> 204 | 404
handleCreateBlock(request, reply)                   // -> 201 { block }
handleUpdateBlock(request, reply)                   // -> 200 { block } | 404
handleDeleteBlock(request, reply)                   // -> 204 | 404
handleReorderBlocks(request, reply)                 // -> 200 { ok: true }
```

---

## Etape 6 : Backend — Routes association

**Nouveau fichier** : `packages/server/src/routes/association.ts`

```ts
// ── Public ──
GET  /api/associations              -> handleListPublishedAssociations
GET  /api/associations/:slug        -> handleGetAssociationBySlug

// ── Admin (requireAdmin preHandler) ──
GET    /api/admin/associations                          -> handleListAllAssociations
POST   /api/admin/associations                          -> handleCreateAssociation      (body: CreateAssociationSchema)
PUT    /api/admin/associations/:id                      -> handleUpdateAssociation      (body: UpdateAssociationSchema)
DELETE /api/admin/associations/:id                      -> handleDeleteAssociation
POST   /api/admin/associations/:id/blocks               -> handleCreateBlock            (body: CreateBlockSchema)
PUT    /api/admin/associations/:id/blocks/:blockId      -> handleUpdateBlock            (body: UpdateBlockSchema)
DELETE /api/admin/associations/:id/blocks/:blockId      -> handleDeleteBlock
PUT    /api/admin/associations/:id/blocks/reorder       -> handleReorderBlocks          (body: ReorderBlocksSchema)
```

---

## Etape 7 : Enregistrer les routes

**Modifier** : `packages/server/src/routes/index.ts`

Ajouter import + register :

```ts
import { associationRoutes } from './association.js'
// ...
await fastify.register(associationRoutes)
```

---

## Etape 8 : Frontend — Hook useAssociations

**Nouveau fichier** : `packages/client/src/hooks/useAssociations.ts`

```ts
// ── Public queries ──
useAssociations()
  // GET /api/associations -> queryKey ['associations']

useAssociation(slug: string)
  // GET /api/associations/:slug -> queryKey ['associations', slug]

// ── Admin queries ──
useAdminAssociations()
  // GET /api/admin/associations -> queryKey ['admin', 'associations']

// ── Admin mutations ──
useCreateAssociation()
  // POST /api/admin/associations -> invalidates ['admin', 'associations'] + ['associations']

useUpdateAssociation()
  // PUT /api/admin/associations/:id -> invalidates same

useDeleteAssociation()
  // DELETE /api/admin/associations/:id -> invalidates same

useCreateBlock(associationId: number)
  // POST /api/admin/associations/:id/blocks -> invalidates ['admin', 'associations'] + ['associations']

useUpdateBlock(associationId: number)
  // PUT /api/admin/associations/:id/blocks/:blockId -> invalidates same

useDeleteBlock(associationId: number)
  // DELETE /api/admin/associations/:id/blocks/:blockId -> invalidates same

useReorderBlocks(associationId: number)
  // PUT /api/admin/associations/:id/blocks/reorder -> invalidates same
```

---

## Etape 9 : Frontend — Composants de rendu des blocs

**Nouveau dossier** : `packages/client/src/components/blocks/`

Chaque fichier est un composant React recevant `content` en prop :

| Fichier                  | Bloc rendu                                                  |
|--------------------------|-------------------------------------------------------------|
| `HeadingBlock.tsx`       | Rendu H1/H2/H3 selon `content.level`                       |
| `TextBlock.tsx`          | Rendu HTML sanitise via DOMPurify (`dangerouslySetInnerHTML`) |
| `ImageBlock.tsx`         | `<figure>` avec `<img>` responsive + `<figcaption>` optionnel |
| `VideoBlock.tsx`         | Embed iframe YouTube/Twitch, ou `<video>` pour custom       |
| `CtaButtonBlock.tsx`     | `<a>` style comme bouton, primary ou secondary              |
| `ProgressBarBlock.tsx`   | Barre de progression animee (CSS) avec label + pourcentage  |
| `DonationLinkBlock.tsx`  | Bouton/lien style vers page don externe                     |
| `QuoteBlock.tsx`         | `<blockquote>` style avec auteur optionnel                  |
| `BlockRenderer.tsx`      | Switch/dispatch qui rend le bon composant selon `block.type`|
| `blocks.module.css`      | Styles communs pour tous les blocs                          |

---

## Etape 10 : Frontend — Page publique AssociationsPage

**Nouveaux fichiers** :
- `packages/client/src/pages/AssociationsPage.tsx`
- `packages/client/src/pages/AssociationsPage.module.css`

**Fonctionnement** :
1. Appel `useAssociations()` pour recuprer la liste des associations publiees
2. Affichage d'onglets (un par association, tries par sortOrder)
3. Chaque onglet affiche le logo + nom de l'association
4. Le contenu de l'onglet actif = liste ordonnee des blocs rendus via `BlockRenderer`
5. Gestion des etats : loading spinner, empty state, erreur
6. SEOHead avec titre "Associations" + meta description
7. URL param optionnel (`?asso=slug`) pour deep-linking vers un onglet precis

---

## Etape 11 : Frontend — Panel admin CMS

**Modifier** : `packages/client/src/pages/AdminPage.tsx`

Ajouter un 5eme onglet "Associations" dans le panel admin existant.

**Nouveau fichier** : `packages/client/src/components/admin/AssociationsPanel.tsx`
**Nouveau fichier** : `packages/client/src/components/admin/AssociationsPanel.module.css`
**Nouveau fichier** : `packages/client/src/components/admin/BlockEditor.tsx`

### AssociationsPanel

Vue a deux niveaux :

**Niveau 1 — Liste des associations** :
- Tableau/liste des associations (nom, slug, publiee/brouillon, nb blocs, actions)
- Bouton "Creer une association" -> formulaire (nom, logo upload, slug auto-genere)
- Actions par association : Editer contenu, Publier/Depublier, Supprimer
- Boutons fleches haut/bas pour reordonner les associations

**Niveau 2 — Editeur de contenu (quand on clique "Editer contenu")** :
- Header : nom de l'association + bouton retour
- Liste ordonnee des blocs existants, chaque bloc affiche :
  - Badge du type (HEADING, TEXT, etc.)
  - Apercu compact du contenu
  - Boutons : Editer / Supprimer / Monter / Descendre
- Bouton "Ajouter un bloc" -> selection du type -> formulaire adapte :
  - HEADING : input texte + select niveau (H1/H2/H3)
  - TEXT : textarea HTML (basique, pas besoin d'editeur WYSIWYG complexe dans un premier temps)
  - IMAGE : upload d'image (via /api/upload existant) + champs alt et caption
  - VIDEO : input URL + auto-detection provider (youtube/twitch)
  - CTA_BUTTON : inputs label + URL + select style
  - PROGRESS_BAR : inputs current/goal/label/unit
  - DONATION_LINK : inputs label + URL
  - QUOTE : textarea texte + input auteur

### BlockEditor

Composant qui rend le formulaire d'edition adapte au type de bloc selectionne. Recoit `type`, `initialContent?`, `onSave`, `onCancel` en props.

---

## Etape 12 : Integration navigation

### App.tsx

Ajouter la route publique :

```tsx
import AssociationsPage from './pages/AssociationsPage.tsx'
// ...
<Route path="/associations" element={<AssociationsPage />} />
```

### AppLayout.tsx

Ajouter un lien "Associations" dans `navLinks`, entre "Classement" et le lien Moderation :

```tsx
<NavLink to="/associations" className={...}>
  Associations
</NavLink>
```

---

## Etape 13 : Installer DOMPurify

```bash
cd packages/client
pnpm add dompurify
pnpm add -D @types/dompurify
```

Utilise dans `TextBlock.tsx` pour sanitiser le HTML avant `dangerouslySetInnerHTML`.

---

## Etape 14 : Build & verification

```bash
# Rebuild shared schemas
cd packages/shared && pnpm build

# Generate Prisma client
cd packages/server && npx prisma generate

# TypeScript build check
cd packages/server && pnpm build
cd packages/client && pnpm build
```

---

## Ordre d'execution

1. Schema Prisma + migration (etapes 1-2)
2. Schemas Zod partages (etape 3)
3. Backend complet : service -> controller -> routes -> register (etapes 4-7)
4. Installer DOMPurify (etape 13)
5. Frontend : hooks (etape 8)
6. Frontend : composants blocs (etape 9)
7. Frontend : page publique (etape 10)
8. Frontend : panel admin CMS (etape 11)
9. Navigation (etape 12)
10. Build & verification (etape 14)

---

## Fichiers crees (total : ~15 nouveaux fichiers)

| Fichier | Type |
|---------|------|
| `packages/server/prisma/schema.prisma` | Modifie |
| `packages/server/prisma/migrations/xxx_add_associations_cms/` | Nouveau (auto) |
| `packages/shared/src/schemas/association.schema.ts` | Nouveau |
| `packages/shared/src/schemas/index.ts` | Modifie |
| `packages/server/src/services/association.service.ts` | Nouveau |
| `packages/server/src/controllers/association.controller.ts` | Nouveau |
| `packages/server/src/routes/association.ts` | Nouveau |
| `packages/server/src/routes/index.ts` | Modifie |
| `packages/client/src/hooks/useAssociations.ts` | Nouveau |
| `packages/client/src/components/blocks/BlockRenderer.tsx` | Nouveau |
| `packages/client/src/components/blocks/HeadingBlock.tsx` | Nouveau |
| `packages/client/src/components/blocks/TextBlock.tsx` | Nouveau |
| `packages/client/src/components/blocks/ImageBlock.tsx` | Nouveau |
| `packages/client/src/components/blocks/VideoBlock.tsx` | Nouveau |
| `packages/client/src/components/blocks/CtaButtonBlock.tsx` | Nouveau |
| `packages/client/src/components/blocks/ProgressBarBlock.tsx` | Nouveau |
| `packages/client/src/components/blocks/DonationLinkBlock.tsx` | Nouveau |
| `packages/client/src/components/blocks/QuoteBlock.tsx` | Nouveau |
| `packages/client/src/components/blocks/blocks.module.css` | Nouveau |
| `packages/client/src/pages/AssociationsPage.tsx` | Nouveau |
| `packages/client/src/pages/AssociationsPage.module.css` | Nouveau |
| `packages/client/src/components/admin/AssociationsPanel.tsx` | Nouveau |
| `packages/client/src/components/admin/AssociationsPanel.module.css` | Nouveau |
| `packages/client/src/components/admin/BlockEditor.tsx` | Nouveau |
| `packages/client/src/pages/AdminPage.tsx` | Modifie |
| `packages/client/src/App.tsx` | Modifie |
| `packages/client/src/components/AppLayout.tsx` | Modifie |

## Dependances a ajouter

- `dompurify` + `@types/dompurify` (client)
