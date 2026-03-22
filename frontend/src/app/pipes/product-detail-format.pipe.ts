import { Pipe, PipeTransform } from '@angular/core';

/**
 * Chuyển product_detail từ text (xuống dòng, gạch đầu dòng -) sang HTML hiển thị đúng format.
 * Dùng trong [innerHTML] để render bullet list và paragraph.
 */
@Pipe({ name: 'productDetailFormat' })
export class ProductDetailFormatPipe implements PipeTransform {
  transform(raw: string | null | undefined): string {
    if (!raw || typeof raw !== 'string') return '';
    const lines = raw.split(/\r?\n/);
    const parts: string[] = [];
    let inList = false;
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      if (/^-\s*/.test(t)) {
        const content = t.replace(/^-\s*/, '').trim();
        if (!content) continue;
        if (!inList) { parts.push('<ul class="detail-bullet-list">'); inList = true; }
        parts.push(`<li>${this.escapeHtml(content)}</li>`);
      } else {
        if (inList) { parts.push('</ul>'); inList = false; }
        parts.push(`<p class="detail-paragraph">${this.escapeHtml(t)}</p>`);
      }
    }
    if (inList) parts.push('</ul>');
    return parts.length ? parts.join('') : '';
  }

  private escapeHtml(s: string): string {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
