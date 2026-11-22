/**
 * The lab shorthand, on screen.
 *
 * The markup is built in lib/fishbone so that one definition of each
 * skeleton serves the screen and the printed note. A fax cannot be
 * hovered, and two drawings of a chem-7 that drift apart is a reader
 * being taught the diagram twice.
 */
import { fishboneHtml, otherLabsHtml, LABS_NOTE } from '../../lib/fishbone';
import type { LabPanel } from '../../domain/types';

export function Fishbone({ panels }: { panels: LabPanel[] }) {
  const html = fishboneHtml(panels);
  if (!html) return null;
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export function OtherLabs({ panels }: { panels: LabPanel[] }) {
  const html = otherLabsHtml(panels);
  if (!html) return null;
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <p className="labsnote">{LABS_NOTE}</p>
    </>
  );
}
