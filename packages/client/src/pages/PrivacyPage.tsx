import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead.tsx'
import styles from './PrivacyPage.module.css'

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <SEOHead title="Politique de confidentialité" description="Traitement des données et choix de confidentialité pour Extia Gaming 24h." canonicalPath="/politique-de-confidentialite" />
      <h1 className={styles.title}>Politique de confidentialité</h1>
      <p className={styles.updated}>Dernière mise à jour : 16 octobre 2026</p>
      <div className={styles.content}>
        <section className={styles.section} aria-labelledby="controller-title">
          <h2 className={styles.sectionTitle} id="controller-title">Responsable du traitement</h2>
          <p className={styles.text}>Extia, organisateur de l’événement Extia Gaming 24h, est responsable des traitements décrits ici. Le site et sa base de données sont hébergés par Extia en France. Les coordonnées légales complètes d’Extia doivent être renseignées dans les <Link to="/mentions-legales">mentions légales</Link> avant l’ouverture des inscriptions.</p>
          <p className={styles.text}>Pour toute question ou pour exercer vos droits : <a href="mailto:dpo@extia.fr">dpo@extia.fr</a>.</p>
          <p className={styles.text}>La création d’un compte implique l’acceptation du règlement de participation. Les traitements nécessaires à la participation et les statistiques facultatives reposent sur des bases légales distinctes.</p>
        </section>
        <section className={styles.section} aria-labelledby="purpose-title">
          <h2 className={styles.sectionTitle} id="purpose-title">Finalités, bases légales et conservation</h2>
          <div className={styles.tableWrapper}><table className={styles.table}>
            <caption>Utilisation de vos données</caption>
            <thead><tr><th scope="col">Finalité</th><th scope="col">Base légale</th><th scope="col">Durée de conservation</th></tr></thead>
            <tbody>
              <tr><td>Inscription, confirmation de majorité, authentification, gestion du compte et de la participation, suivi des effectifs, calcul des totaux de points, résultats, classements, récompenses et rattachement facultatif des points à un groupe.</td><td>Exécution du règlement / contrat de participation (article 6 § 1 b du RGPD).</td><td>Durée de l’événement, puis suppression au plus tard 90 jours après sa clôture.</td></tr>
              <tr><td>Statistiques et KPI facultatifs de participation, notamment par provenance : participation aux jeux, inscriptions, présences et points. Les exports statistiques utilisent le pseudo et des identifiants internes, sans nom, prénom ni email.</td><td>Votre consentement facultatif (article 6 § 1 a du RGPD).</td><td>Jusqu’au retrait du consentement et au plus tard 90 jours après la clôture. Après retrait, vos données ne sont plus incluses dans les nouveaux indicateurs et exports statistiques facultatifs.</td></tr>
              <tr><td>Chargement des lecteurs externes YouTube et Twitch et de leurs traceurs.</td><td>Consentement préalable distinct pour chaque service (article 82 de la loi Informatique et Libertés ; article 6 § 1 a du RGPD pour les données personnelles associées).</td><td>Autorisation conservée en mémoire jusqu’au rechargement de la page ou à son retrait. La durée des traceurs et des données du fournisseur est précisée dans sa politique.</td></tr>
              <tr><td>Notifications de rappel dans le navigateur, lorsque vous les demandez.</td><td>Votre consentement facultatif (article 6 § 1 a du RGPD).</td><td>Jusqu’à la désactivation depuis le profil et au plus tard 90 jours après la clôture de l’événement.</td></tr>
            </tbody>
          </table></div>
          <p className={styles.text}>Aucune prise de décision produisant des effets juridiques ou similaires n’est fondée exclusivement sur un traitement automatisé. Le calcul des scores sert au classement du jeu et reste soumis à la vérification de l’équipe organisatrice.</p>
        </section>
        <section className={styles.section} aria-labelledby="data-title">
          <h2 className={styles.sectionTitle} id="data-title">Données collectées et champs obligatoires</h2>
          <ul className={styles.list}>
            <li><strong>Pseudo, nom, prénom, adresse email et mot de passe :</strong> obligatoires pour créer et gérer votre compte. Sans ces informations, l’inscription et l’authentification ne sont pas possibles. Le mot de passe est stocké sous une forme protégée, jamais en clair.</li>
            <li><strong>Acceptation du règlement et confirmation d’un âge de 18 ans ou plus :</strong> obligatoires. Leur date et la version du règlement sont enregistrées ; aucune date de naissance n’est demandée.</li>
            <li><strong>Provenance (agence, alumni ou partenaire) :</strong> facultative, avec les groupes proposés dans le formulaire. Elle permet le rattachement de vos points au groupe choisi. Vous pouvez participer sans la renseigner et la modifier depuis votre profil. Elle n’est utilisée pour les statistiques qu’avec votre consentement.</li>
            <li><strong>Consentement aux statistiques :</strong> facultatif, non pré-coché. Votre choix, sa date de mise à jour et la version de la mention sont enregistrés. Le refus ou le retrait n’a aucun effet sur votre inscription, vos points ou votre participation.</li>
            <li><strong>Bilan général de l’événement :</strong> tous les inscrits, y compris ceux qui refusent les statistiques facultatives, restent comptés dans les effectifs et les totaux de points nécessaires à l’organisation. Les classements, points par jeu et points collectifs ne sont pas réduits par un refus ou un retrait du consentement statistique.</li>
            <li><strong>Participation :</strong> inscriptions aux activités, confirmations de présence, parties déclarées, preuves de résultat lorsque demandées, scores, bonus et récompenses sont enregistrés selon les activités auxquelles vous participez. Sans les éléments requis pour valider une activité, la présence ou le résultat ne peut pas être validé.</li>
            <li><strong>Données de connexion :</strong> identifiants de session, jetons d’authentification, dates techniques et journaux de requêtes pouvant contenir une adresse IP. Ces données sont générées lors de l’utilisation du service.</li>
            <li><strong>Notifications :</strong> si vous activez les notifications du navigateur, une adresse technique d’abonnement et les clés nécessaires à leur envoi sont enregistrées. L’activation est facultative et peut être retirée depuis votre profil.</li>
          </ul>
        </section>
        <section className={styles.section} aria-labelledby="public-title">
          <h2 className={styles.sectionTitle} id="public-title">Visibilité publique</h2>
          <p className={styles.text}>Votre pseudo, vos scores, résultats et classements sont affichés publiquement, y compris aux visiteurs non connectés. Le groupe choisi et le détail des points peuvent également apparaître. Nous vous recommandons d’utiliser un pseudo qui ne révèle pas votre identité réelle. Vos nom, prénom et adresse email ne sont pas destinés à l’affichage public.</p>
          <p className={styles.text}>Les utilisateurs du site ne sont pas diffusés sur les photos ou streams de l’événement.</p>
        </section>
        <section className={styles.section} aria-labelledby="recipients-title">
          <h2 className={styles.sectionTitle} id="recipients-title">Destinataires et transferts hors Union européenne</h2>
          <p className={styles.text}>Les informations nécessaires à l’organisation sont accessibles aux membres habilités de l’équipe organisatrice et aux personnes habilitées d’Extia chargées de l’hébergement et de la maintenance, dans la limite de leurs missions. Les données publiques sont accessibles aux visiteurs selon la section précédente. Aucune donnée personnelle issue du site n’est transmise aux partenaires ou aux associations bénéficiaires.</p>
          <p className={styles.text}>L’hébergement du site et de la base de données est assuré en France. L’organisation ne prévoit pas de transfert hors UE pour cet hébergement. Lorsque vous autorisez un lecteur YouTube ou Twitch, des données sont transmises à ce fournisseur, qui peut les traiter hors UE, notamment aux États-Unis. Ses destinataires, lieux de traitement et garanties sont détaillés dans sa politique, accessible ci-dessous.</p>
          <p className={styles.text}>Le site ne collecte pas de données bancaires, ne traite pas de dons financiers et n’émet pas de reçus fiscaux. Les liens de dons conduisent vers des plateformes externes : leurs traitements relèvent de leurs propres politiques.</p>
        </section>
        <section className={styles.section} aria-labelledby="retention-title">
          <h2 className={styles.sectionTitle} id="retention-title">Suppression et historique annuel</h2>
          <p className={styles.text}>Les données personnelles de l’événement doivent être supprimées au plus tard <strong>90 jours après sa clôture</strong>. Cette règle couvre aussi les copies de travail et exports détenus par l’organisation ainsi que les fichiers de preuve et journaux contenant des données personnelles. Les sauvegardes doivent être intégrées à la procédure de suppression.</p>
          <p className={styles.text}>Au-delà de ce délai, seuls des résultats entièrement anonymisés et agrégés peuvent être conservés pour comparer les éditions. Un historique ne doit contenir ni pseudo, ni identifiant individuel, ni ligne personnelle, ni groupe ou combinaison permettant de réidentifier une personne. La simple suppression du nom ne suffit pas à anonymiser les données.</p>
        </section>
        <section className={styles.section} aria-labelledby="rights-title">
          <h2 className={styles.sectionTitle} id="rights-title">Vos droits</h2>
          <p className={styles.text}>Dans les conditions prévues par les textes, vous disposez des droits d’accès, de rectification, d’effacement, de limitation du traitement et de portabilité de vos données. Vous pouvez également définir des directives relatives à la conservation, à l’effacement et à la communication de vos données après votre décès.</p>
          <p className={styles.text}>Vous pouvez corriger vos informations depuis le <Link to="/profil">profil</Link> et retirer à tout moment votre consentement aux statistiques en cliquant sur « Retirer mon consentement ». Le retrait ne remet pas en cause la licéité des traitements réalisés avant celui-ci. Pour les copies d’exports statistiques déjà téléchargées par l’organisation, contactez le DPO afin que votre retrait soit pris en compte. Les agrégats déjà rendus irréversiblement anonymes ne permettent plus de vous identifier.</p>
          <p className={styles.text}>Pour exercer vos autres droits, contactez <a href="mailto:dpo@extia.fr">dpo@extia.fr</a>. Vous pouvez adresser une réclamation à la <a href="https://www.cnil.fr/fr/adresser-une-plainte" target="_blank" rel="noopener noreferrer">CNIL</a>.</p>
        </section>
        <section className={styles.section} aria-labelledby="opposition-title">
          <h2 className={styles.sectionTitle} id="opposition-title">Droit d’opposition</h2>
          <p className={styles.text}>Le droit d’opposition s’applique, dans les conditions de l’article 21 du RGPD, aux traitements fondés sur l’intérêt légitime ou une mission d’intérêt public. Les traitements de participation décrits ici reposent sur le contrat et les statistiques sur le consentement : pour ces dernières, vous pouvez retirer votre consentement depuis le profil. Pour toute demande d’opposition concernant un traitement auquel ce droit s’applique, contactez le DPO à l’adresse ci-dessus.</p>
        </section>
        <section className={styles.section} aria-labelledby="security-title">
          <h2 className={styles.sectionTitle} id="security-title">Sécurité</h2>
          <p className={styles.text}>Les mots de passe sont stockés sous une forme protégée, les flux de connexion sont sécurisés et les accès aux données personnelles sont restreints aux personnes habilitées. Les détails techniques des mesures de sécurité sont conservés dans la documentation interne.</p>
        </section>
        <section className={styles.section} aria-labelledby="cookies">
          <h2 className={styles.sectionTitle} id="cookies">Cookies et contenus externes</h2>
          <p className={styles.text}>Les cookies <code>access_token</code> (15 minutes) et <code>refresh_token</code> (7 jours) assurent la connexion et son renouvellement. Ils sont strictement nécessaires et exemptés de consentement. Aucun outil de mesure d’audience ni pixel publicitaire propre au site n’est intégré. Les statistiques de participation sont calculées à partir des données du site, sous réserve de votre accord distinct dans le compte.</p>
          <p className={styles.text}>Les lecteurs <strong>YouTube (Google)</strong> et <strong>Twitch</strong> sont bloqués par défaut. Chaque service ne reçoit de requête du lecteur qu’après votre autorisation explicite. Ces lecteurs peuvent utiliser des traceurs pour fournir la vidéo, mesurer son audience et, selon le fournisseur, personnaliser la publicité. Refuser est possible au même endroit. Le retrait via « Gérer les cookies » en bas de chaque page désactive les lecteurs concernés. Les choix ne sont pas conservés après rechargement.</p>
          <p className={styles.text}>Le retrait bloque les prochains chargements des lecteurs, mais ne supprime pas les cookies tiers déjà déposés : leur suppression se fait dans les paramètres de votre navigateur. Consultez les politiques de <a href="https://policies.google.com/privacy?hl=fr" target="_blank" rel="noopener noreferrer">Google / YouTube</a> et de <a href="https://www.twitch.tv/p/fr-fr/legal/privacy-notice/" target="_blank" rel="noopener noreferrer">Twitch</a> pour connaître leurs traceurs, durées, destinataires, transferts et modalités d’exercice de vos droits.</p>
        </section>
      </div>
    </div>
  )
}
