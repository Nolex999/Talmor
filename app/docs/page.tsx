import { redirect } from 'next/navigation';

const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL ?? 'http://localhost:3001';

export default function DocsPage() {
  redirect(DOCS_URL);
}
