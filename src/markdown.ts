export type SplitResult = {
  body: string;
  title: string;
  children?: SplitResult[];
}

const headerRegex = (headerCount: number) => new RegExp(`^${'#'.repeat(headerCount)} .+$`, 'gm');

export function splitByHeader(str: string, headerCount: number): SplitResult[] {
  const re = headerRegex(headerCount);
  const matchIndices = [];
  const titles = [];
  let match;

  while ((match = re.exec(str)) != null) {
    matchIndices.push(match.index);
    titles.push(match[0]);
  }
  const data: SplitResult[] = [];
  for (let i = 0; i < matchIndices.length; i++) {
    const index = matchIndices[i];
    const raw = str.slice(index, matchIndices[i+1]);
    const full = raw.replace(headerRegex(headerCount), '');
    const title = titles[i];
    let children;
    let body;
    try {
      children = splitByHeader(full, headerCount+1);
      if (children && children.length) {
        const _match = headerRegex(headerCount+1).exec(full) as RegExpExecArray;
        body = full.slice(0, _match.index);
      }
    } catch (err) {}
    body = body || full;
    data.push({ body, title, children });
  }
  return data;
}