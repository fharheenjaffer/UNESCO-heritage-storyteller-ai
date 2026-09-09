import { MonumentKnowledgeDoc } from '../types';
import dataset from './monumentsDataset.json';

export interface RawMonumentEntry {
  id: string;
  name: string;
  location: string;
  unesco_year: number | null;
  history: string[];
  architecture: string;
  facts: string[];
}

export const MONUMENT_RAW_DATASET: RawMonumentEntry[] = dataset.monuments as RawMonumentEntry[];

export const DEFAULT_MONUMENT_KNOWLEDGE: MonumentKnowledgeDoc[] = MONUMENT_RAW_DATASET.map((m) => {
  const historyText = m.history.join('\n\n');
  const factsList = m.facts.map((f, i) => `${i + 1}. ${f}`).join('\n');

  const content = `Monument: ${m.name}
Location: ${m.location}
UNESCO Status: ${m.unesco_year ? `UNESCO World Heritage Site (${m.unesco_year})` : 'Nationally Protected Heritage Monument'}

Historical Background:
${historyText}

Architectural Highlights:
${m.architecture}

Interesting Facts:
${factsList}`;

  // Extract architectural highlights for quick pills
  const highlightList: string[] = [];
  if (m.unesco_year) {
    highlightList.push(`UNESCO Inscribed (${m.unesco_year})`);
  }
  if (m.architecture.includes('marble')) highlightList.push('Marble Architecture');
  else if (m.architecture.includes('sandstone')) highlightList.push('Sandstone Architecture');
  else if (m.architecture.includes('granite')) highlightList.push('Granite Stonecraft');
  else if (m.architecture.includes('rock-cut') || m.architecture.includes('basalt')) highlightList.push('Rock-Cut Basalt');

  // Add 2-3 specific snippets from architecture or facts
  if (m.facts && m.facts.length > 0) {
    const keyFact = m.facts[0].split(',')[0];
    if (keyFact && keyFact.length < 50) {
      highlightList.push(keyFact);
    }
  }

  return {
    id: m.id,
    name: m.name,
    location: m.location,
    state: m.location.split(',')[1]?.trim() || '',
    unesco_year: m.unesco_year,
    unescoStatus: Boolean(m.unesco_year),
    history: m.history,
    architecture: m.architecture,
    facts: m.facts,
    highlights: highlightList.length > 0 ? highlightList : ['Historical Monument of India'],
    thumbnailDescription: `${m.name} in ${m.location}`,
    content,
  };
});
