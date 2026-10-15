import type { ExtractedLink } from '../types'

export function LinkList({ links }: { links: ExtractedLink[] }) {
  if (links.length === 0) return <p className="text-muted-foreground text-sm">No links found.</p>

  return (
    <ul className="flex flex-col divide-y text-sm">
      {links.map((link) => (
        <li key={link.href} className="flex flex-col py-2">
          <span className="font-medium">{link.text || '(no text)'}</span>
          <a href={link.href} target="_blank" rel="noreferrer" className="text-muted-foreground truncate hover:underline">
            {link.href}
          </a>
        </li>
      ))}
    </ul>
  )
}
