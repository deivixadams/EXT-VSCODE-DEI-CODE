/**
 * @file commentUtils.ts
 * Función para determinar el prefijo de comentario según la extensión.
 */

export function getCommentPrefix(ext: string): string {
    const map: Record<string, string> = {
      '.js': '//',
      '.ts': '//',
      '.java': '//',
      '.cpp': '//',
      '.c': '//',
      '.php': '//',
      '.py': '#',
      '.sh': '#',
      '.rb': '#',
      '.html': '<!--',
      '.css': '/*',
      '.scss': '/*'
    };
    return map[ext] ?? '//';
  }
  