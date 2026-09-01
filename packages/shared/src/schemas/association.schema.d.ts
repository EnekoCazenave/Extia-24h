import { z } from 'zod';
export declare const BlockTypeEnum: z.ZodEnum<["HEADING", "TEXT", "IMAGE", "VIDEO", "CTA_BUTTON", "PROGRESS_BAR", "DONATION_LINK", "QUOTE"]>;
export type BlockTypeLiteral = z.infer<typeof BlockTypeEnum>;
export declare const HeadingContentSchema: z.ZodObject<{
    text: z.ZodString;
    level: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>;
}, "strip", z.ZodTypeAny, {
    text: string;
    level: 1 | 2 | 3;
}, {
    text: string;
    level: 1 | 2 | 3;
}>;
export declare const TextContentSchema: z.ZodObject<{
    html: z.ZodString;
}, "strip", z.ZodTypeAny, {
    html: string;
}, {
    html: string;
}>;
export declare const ImageContentSchema: z.ZodObject<{
    url: z.ZodString;
    alt: z.ZodDefault<z.ZodString>;
    caption: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    url: string;
    alt: string;
    caption?: string | undefined;
}, {
    url: string;
    alt?: string | undefined;
    caption?: string | undefined;
}>;
export declare const VideoContentSchema: z.ZodObject<{
    url: z.ZodString;
    provider: z.ZodEnum<["youtube", "twitch", "custom"]>;
}, "strip", z.ZodTypeAny, {
    url: string;
    provider: "custom" | "youtube" | "twitch";
}, {
    url: string;
    provider: "custom" | "youtube" | "twitch";
}>;
export declare const CtaButtonContentSchema: z.ZodObject<{
    label: z.ZodString;
    url: z.ZodString;
    style: z.ZodDefault<z.ZodEnum<["primary", "secondary"]>>;
}, "strip", z.ZodTypeAny, {
    url: string;
    label: string;
    style: "primary" | "secondary";
}, {
    url: string;
    label: string;
    style?: "primary" | "secondary" | undefined;
}>;
export declare const ProgressBarContentSchema: z.ZodObject<{
    current: z.ZodNumber;
    goal: z.ZodNumber;
    label: z.ZodOptional<z.ZodString>;
    unit: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    current: number;
    goal: number;
    label?: string | undefined;
    unit?: string | undefined;
}, {
    current: number;
    goal: number;
    label?: string | undefined;
    unit?: string | undefined;
}>;
export declare const DonationLinkContentSchema: z.ZodObject<{
    label: z.ZodString;
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url: string;
    label: string;
}, {
    url: string;
    label: string;
}>;
export declare const QuoteContentSchema: z.ZodObject<{
    text: z.ZodString;
    author: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string;
    author?: string | undefined;
}, {
    text: string;
    author?: string | undefined;
}>;
export declare const BlockContentByType: {
    readonly HEADING: z.ZodObject<{
        text: z.ZodString;
        level: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        level: 1 | 2 | 3;
    }, {
        text: string;
        level: 1 | 2 | 3;
    }>;
    readonly TEXT: z.ZodObject<{
        html: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        html: string;
    }, {
        html: string;
    }>;
    readonly IMAGE: z.ZodObject<{
        url: z.ZodString;
        alt: z.ZodDefault<z.ZodString>;
        caption: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        alt: string;
        caption?: string | undefined;
    }, {
        url: string;
        alt?: string | undefined;
        caption?: string | undefined;
    }>;
    readonly VIDEO: z.ZodObject<{
        url: z.ZodString;
        provider: z.ZodEnum<["youtube", "twitch", "custom"]>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        provider: "custom" | "youtube" | "twitch";
    }, {
        url: string;
        provider: "custom" | "youtube" | "twitch";
    }>;
    readonly CTA_BUTTON: z.ZodObject<{
        label: z.ZodString;
        url: z.ZodString;
        style: z.ZodDefault<z.ZodEnum<["primary", "secondary"]>>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        label: string;
        style: "primary" | "secondary";
    }, {
        url: string;
        label: string;
        style?: "primary" | "secondary" | undefined;
    }>;
    readonly PROGRESS_BAR: z.ZodObject<{
        current: z.ZodNumber;
        goal: z.ZodNumber;
        label: z.ZodOptional<z.ZodString>;
        unit: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        current: number;
        goal: number;
        label?: string | undefined;
        unit?: string | undefined;
    }, {
        current: number;
        goal: number;
        label?: string | undefined;
        unit?: string | undefined;
    }>;
    readonly DONATION_LINK: z.ZodObject<{
        label: z.ZodString;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
        label: string;
    }, {
        url: string;
        label: string;
    }>;
    readonly QUOTE: z.ZodObject<{
        text: z.ZodString;
        author: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        author?: string | undefined;
    }, {
        text: string;
        author?: string | undefined;
    }>;
};
export declare function validateBlockContent(type: BlockTypeLiteral, content: unknown): {
    text: string;
    level: 1 | 2 | 3;
} | {
    html: string;
} | {
    url: string;
    alt: string;
    caption?: string | undefined;
} | {
    url: string;
    provider: "custom" | "youtube" | "twitch";
} | {
    current: number;
    goal: number;
    label?: string | undefined;
    unit?: string | undefined;
} | {
    url: string;
    label: string;
} | {
    text: string;
    author?: string | undefined;
};
export declare const CreateAssociationSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    logoUrl: z.ZodOptional<z.ZodString>;
    published: z.ZodOptional<z.ZodBoolean>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug?: string | undefined;
    logoUrl?: string | undefined;
    published?: boolean | undefined;
    sortOrder?: number | undefined;
}, {
    name: string;
    slug?: string | undefined;
    logoUrl?: string | undefined;
    published?: boolean | undefined;
    sortOrder?: number | undefined;
}>;
export declare const UpdateAssociationSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    logoUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    published: z.ZodOptional<z.ZodBoolean>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    slug?: string | undefined;
    logoUrl?: string | null | undefined;
    published?: boolean | undefined;
    sortOrder?: number | undefined;
}, {
    name?: string | undefined;
    slug?: string | undefined;
    logoUrl?: string | null | undefined;
    published?: boolean | undefined;
    sortOrder?: number | undefined;
}>;
export declare const CreateBlockSchema: z.ZodObject<{
    type: z.ZodEnum<["HEADING", "TEXT", "IMAGE", "VIDEO", "CTA_BUTTON", "PROGRESS_BAR", "DONATION_LINK", "QUOTE"]>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    content: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    content: Record<string, unknown>;
    type: "HEADING" | "TEXT" | "IMAGE" | "VIDEO" | "CTA_BUTTON" | "PROGRESS_BAR" | "DONATION_LINK" | "QUOTE";
    sortOrder?: number | undefined;
}, {
    content: Record<string, unknown>;
    type: "HEADING" | "TEXT" | "IMAGE" | "VIDEO" | "CTA_BUTTON" | "PROGRESS_BAR" | "DONATION_LINK" | "QUOTE";
    sortOrder?: number | undefined;
}>;
export declare const UpdateBlockSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<["HEADING", "TEXT", "IMAGE", "VIDEO", "CTA_BUTTON", "PROGRESS_BAR", "DONATION_LINK", "QUOTE"]>>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    content: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    content?: Record<string, unknown> | undefined;
    type?: "HEADING" | "TEXT" | "IMAGE" | "VIDEO" | "CTA_BUTTON" | "PROGRESS_BAR" | "DONATION_LINK" | "QUOTE" | undefined;
    sortOrder?: number | undefined;
}, {
    content?: Record<string, unknown> | undefined;
    type?: "HEADING" | "TEXT" | "IMAGE" | "VIDEO" | "CTA_BUTTON" | "PROGRESS_BAR" | "DONATION_LINK" | "QUOTE" | undefined;
    sortOrder?: number | undefined;
}>;
export declare const ReorderBlocksSchema: z.ZodObject<{
    blockIds: z.ZodArray<z.ZodNumber, "many">;
}, "strip", z.ZodTypeAny, {
    blockIds: number[];
}, {
    blockIds: number[];
}>;
export type CreateAssociationInput = z.infer<typeof CreateAssociationSchema>;
export type UpdateAssociationInput = z.infer<typeof UpdateAssociationSchema>;
export type CreateBlockInput = z.infer<typeof CreateBlockSchema>;
export type UpdateBlockInput = z.infer<typeof UpdateBlockSchema>;
export type ReorderBlocksInput = z.infer<typeof ReorderBlocksSchema>;
export type HeadingContent = z.infer<typeof HeadingContentSchema>;
export type TextContent = z.infer<typeof TextContentSchema>;
export type ImageContent = z.infer<typeof ImageContentSchema>;
export type VideoContent = z.infer<typeof VideoContentSchema>;
export type CtaButtonContent = z.infer<typeof CtaButtonContentSchema>;
export type ProgressBarContent = z.infer<typeof ProgressBarContentSchema>;
export type DonationLinkContent = z.infer<typeof DonationLinkContentSchema>;
export type QuoteContent = z.infer<typeof QuoteContentSchema>;
