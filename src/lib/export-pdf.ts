"use client";
let fontData: string | undefined;
export async function exportPdf(title: string, lines: string[], filename: string) {
 const {jsPDF}=await import("jspdf");
 const pdf=new jsPDF();
 if(!fontData){const response=await fetch("/fonts/arial.ttf");if(!response.ok)throw new Error("Không tải được phông PDF.");const bytes=new Uint8Array(await response.arrayBuffer());let binary="";for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));fontData=btoa(binary);}
 pdf.addFileToVFS("Arial.ttf",fontData);pdf.addFont("Arial.ttf","Arial","normal");pdf.setFont("Arial");
 pdf.setFillColor(15,23,42);pdf.rect(0,0,210,32,"F");pdf.setTextColor(255,255,255);pdf.setFontSize(17);pdf.text(title,16,20);
 pdf.setTextColor(30,41,59);pdf.setFontSize(11);let y=45;
 for(const line of lines){const parts=pdf.splitTextToSize(line,176) as string[];for(const part of parts){if(y>275){pdf.addPage();y=20;}pdf.text(part,16,y);y+=7;}y+=2;}
 const count=pdf.getNumberOfPages();for(let page=1;page<=count;page++){pdf.setPage(page);pdf.setTextColor(100,116,139);pdf.setFontSize(9);pdf.text("Logistics CRM",16,290);pdf.text(page+"/"+count,185,290);}
 pdf.save(filename);return pdf.output("blob");
}
