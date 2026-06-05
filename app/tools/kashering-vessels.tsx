/**
 * Year-round vessel kashering (not for Pesach) — full-screen embed.
 */
import React from 'react';
import { EmbeddedWebView } from '../../src/components/EmbeddedWebView';

const URL = 'https://www.kosharot.co.il/index2.php?id=411721&lang=HEB';

export default function KasheringVesselsScreen() {
  return (
    <EmbeddedWebView
      url={URL}
      title="הוראות הכשרת כלים"
      subtitle="כל ימות השנה · מכון כושרות"
    />
  );
}
