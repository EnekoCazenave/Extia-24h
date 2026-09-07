import type {
  HeadingContent,
  TextContent,
  ImageContent,
  VideoContent,
  CtaButtonContent,
  ProgressBarContent,
  DonationLinkContent,
  QuoteContent,
} from '@extia-gaming/shared'
import type { AssociationBlock } from '../../hooks/useAssociations.ts'
import { HeadingBlock } from './HeadingBlock.tsx'
import { TextBlock } from './TextBlock.tsx'
import { ImageBlock } from './ImageBlock.tsx'
import { VideoBlock } from './VideoBlock.tsx'
import { CtaButtonBlock } from './CtaButtonBlock.tsx'
import { ProgressBarBlock } from './ProgressBarBlock.tsx'
import { DonationLinkBlock } from './DonationLinkBlock.tsx'
import { QuoteBlock } from './QuoteBlock.tsx'
import styles from './blocks.module.css'

export function BlockRenderer({ block }: { block: AssociationBlock }) {
  const content = block.content as unknown
  let rendered: React.ReactNode = null
  switch (block.type) {
    case 'HEADING':
      rendered = <HeadingBlock content={content as HeadingContent} />
      break
    case 'TEXT':
      rendered = <TextBlock content={content as TextContent} />
      break
    case 'IMAGE':
      rendered = <ImageBlock content={content as ImageContent} />
      break
    case 'VIDEO':
      rendered = <VideoBlock content={content as VideoContent} />
      break
    case 'CTA_BUTTON':
      rendered = <CtaButtonBlock content={content as CtaButtonContent} />
      break
    case 'PROGRESS_BAR':
      rendered = <ProgressBarBlock content={content as ProgressBarContent} />
      break
    case 'DONATION_LINK':
      rendered = <DonationLinkBlock content={content as DonationLinkContent} />
      break
    case 'QUOTE':
      rendered = <QuoteBlock content={content as QuoteContent} />
      break
    default:
      return null
  }
  return <div className={styles.block}>{rendered}</div>
}
