import { useState } from 'react'
import { buildEmbedUrl } from '../lib/youtube'

/**
 * The in-app music player — a YouTube embed via youtube-nocookie.com.
 *
 * Embeds can fail (some videos disable embedding, networks hiccup), and a
 * cross-origin iframe won't tell us. So a gentle reassurance line is always
 * shown; nothing ever looks "broken" to the person (PRD §13 / §16.8).
 */
export default function MusicEmbed({
  videoId,
  title,
}: {
  videoId: string
  title: string
}) {
  const [loaded, setLoaded] = useState(false)

  return (
    <figure className="overflow-hidden rounded-xl border border-cream-deep bg-[#FFFDF9] shadow-card">
      <div className="relative aspect-video w-full bg-cream-soft">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-ink-faint">
            Loading the song…
          </div>
        )}
        <iframe
          className="relative h-full w-full"
          src={buildEmbedUrl(videoId)}
          title={`Music: ${title}`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
      </div>
      <figcaption className="px-4 py-3 text-base text-ink-muted">
        ♪ {title}
        <span className="ml-2 text-ink-faint">
          — if it doesn&rsquo;t play, that&rsquo;s perfectly okay.
        </span>
      </figcaption>
    </figure>
  )
}
