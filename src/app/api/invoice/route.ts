import { NextRequest, NextResponse } from "next/server";
import { ADAMO_COMPANY as C } from "@/lib/company";

// GET /api/invoice?orderId=X&date=Y&buyerName=Z&buyerIdno=W&items=[...]&total=N
// Returns a printable HTML page. Open in new tab → browser print → Save as PDF.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const orderId   = searchParams.get("orderId")   ?? "";
  const date      = searchParams.get("date")       ?? new Date().toLocaleDateString("ro-MD");
  const buyerName = searchParams.get("buyerName")  ?? "";
  const buyerIdno = searchParams.get("buyerIdno")  ?? "";

  let items: { name: string; qty: number; price: number }[] = [];
  try {
    items = JSON.parse(searchParams.get("items") ?? "[]");
  } catch {}

  const total = Number(searchParams.get("total") ?? 0);

  const rows = items
    .map(
      (item, i) => `
      <tr>
        <td>${escHtml(item.name)}</td>
        <td class="center">Buc.</td>
        <td class="center">${item.qty}</td>
        <td class="right">${fmt(item.price)}</td>
        <td class="right">${fmt(item.price * item.qty)}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Cont spre plată ${orderId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 40px 50px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  .company-info { max-width: 400px; line-height: 1.7; }
  .company-info p { margin-bottom: 2px; }
  .logo { width: 160px; }
  .title { text-align: center; font-size: 14px; font-weight: bold; margin: 32px 0 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #555; padding: 7px 10px; font-size: 11px; }
  th { background: #f0f0f0; font-weight: bold; text-align: center; }
  td.center { text-align: center; }
  td.right { text-align: right; }
  .total-row td { font-weight: bold; }
  .footer { margin-top: 60px; display: flex; justify-content: space-between; font-size: 12px; }
  .buyer-info { margin-bottom: 20px; font-size: 12px; line-height: 1.8; }
  @media print {
    body { padding: 20px 30px; }
    @page { margin: 1cm; size: A4; }
  }
</style>
</head>
<body>
<div class="header">
  <div class="company-info">
    <p><strong>${escHtml(C.name)}</strong></p>
    <p>${escHtml(C.legalAddress)}</p>
    <p>Adresa Magazin: ${escHtml(C.storeAddress)}</p>
    <p>Tel/ Dir./Contabilitate ${escHtml(C.phoneDir)}, Sectia vinzari ${escHtml(C.phoneSales)}</p>
    <p>Cod fiscal: <strong>${escHtml(C.regNumber)}</strong>, cod TVA <strong>${escHtml(C.vatCode)}</strong></p>
    <p>Rechizitele bancare IBAN <strong>${escHtml(C.iban)}</strong></p>
    <p>${escHtml(C.bank)}&nbsp; Cod bancar &nbsp;<strong>${escHtml(C.bic)}</strong></p>
  </div>
  <img class="logo" src="https://adamo.md/logo-dark.svg" alt="Adamo" onerror="this.style.display='none'" />
</div>

${buyerName ? `<div class="buyer-info"><p><strong>Cumpărător:</strong> ${escHtml(buyerName)}${buyerIdno ? `, IDNO: ${escHtml(buyerIdno)}` : ""}</p></div>` : ""}

<div class="title">Cont spre plata ${escHtml(orderId)} din ${escHtml(date)}</div>

<table>
  <thead>
    <tr>
      <th style="width:45%">Denumirea marfii</th>
      <th style="width:8%">U.m.</th>
      <th style="width:10%">Cantitate</th>
      <th style="width:18%">Pret unitar MDL,<br/>TVA inclus</th>
      <th style="width:19%">Total MDL</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
    <tr class="total-row">
      <td><strong>Total spre plată, în MDL</strong></td>
      <td class="center">x</td>
      <td class="center">x</td>
      <td class="center">x</td>
      <td class="right"><strong>${fmt(total)}</strong></td>
    </tr>
  </tbody>
</table>

<div class="footer">
  <span>Administrator ${escHtml(C.name)}</span>
  <span>${escHtml(C.administrator)}</span>
</div>

<script>window.onload = () => window.print();</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmt(n: number): string {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
