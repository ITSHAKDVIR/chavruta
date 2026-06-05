/**
 * Pesach kitchen kashering — full-screen WebView embed of the kosharot.co.il
 * guide. No buttons, no extra content — the entire screen IS the embedded
 * page. Use the system browser button (top-right) if needed.
 */
import React from 'react';
import { EmbeddedWebView } from '../../src/components/EmbeddedWebView';

const URL = 'https://www.kosharot.co.il/index2.php?id=411731&lang=HEB';

export default function KasheringScreen() {
  return (
    <EmbeddedWebView
      url={URL}
      title="הכשרת המטבח לפסח"
      subtitle="המדריך המלא מאתר מכון כושרות"
    />
  );
}
