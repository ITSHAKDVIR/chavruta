/**
 * Bug-check guide — full-screen WebView embed.
 */
import React from 'react';
import { EmbeddedWebView } from '../../src/components/EmbeddedWebView';

const URL = 'https://www.kosharot.co.il/index2.php?id=7&lang=HEB';

export default function BugCheckScreen() {
  return (
    <EmbeddedWebView
      url={URL}
      title="בדיקת חרקים במזון"
      subtitle="מדריך מאות מוצרים · מכון כושרות"
    />
  );
}
