import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).filter(k => k !== 'id' && k !== 'userId');
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const val = row[header];
      if (val instanceof Date) return JSON.stringify(val.toISOString());
      return JSON.stringify(val || '');
    }).join(','))
  ].join('\n');

  const capitalizedFilename = filename.charAt(0).toUpperCase() + filename.slice(1);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${capitalizedFilename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (data: any[], filename: string) => {
  if (data.length === 0) return;
  // Clean data: remove technical fields
  const cleanedData = data.map(item => {
    const { id, userId, ...rest } = item;
    return rest;
  });
  const capitalizedFilename = filename.charAt(0).toUpperCase() + filename.slice(1);
  const worksheet = XLSX.utils.json_to_sheet(cleanedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${capitalizedFilename}.xlsx`);
};

export const exportToPDF = (
  data: any[], 
  filename: string, 
  title: string, 
  userInfo?: { fullName?: string | null, email?: string | null, mobile?: string | null }
) => {
  if (data.length === 0) return;
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Add Header with Branding
  doc.setFontSize(28);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.setFont("helvetica", "bold");
  doc.text("Money Details", 14, 20);
  
  // Add Report Title
  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55); // gray-800
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 30);
  
  // Create a separator line
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.line(14, 35, pageWidth - 14, 35);
  
  // Add User Information Block
  doc.setFontSize(10);
  doc.setTextColor(55, 65, 81); // gray-700
  let currentY = 44;
  
  doc.setFont("helvetica", "bold");
  doc.text("User Information:", 14, currentY);
  currentY += 6;
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128); // gray-500
  
  if (userInfo) {
    if (userInfo.fullName) {
        const formattedName = String(userInfo.fullName)
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      doc.text(`Full Name: ${formattedName}`, 14, currentY);
      currentY += 5;
    }
    if (userInfo.email) {
      doc.setTextColor(79, 70, 229); // indigo-600
      doc.text(`Logged-in Email: ${userInfo.email}`, 14, currentY);
      doc.setTextColor(107, 114, 128);
      currentY += 5;
    }
    if (userInfo.mobile) {
      doc.text(`Mobile Number: ${userInfo.mobile}`, 14, currentY);
      currentY += 5;
    }
  }
  
  doc.text(`Report Generated: ${format(new Date(), 'PPpp')}`, 14, currentY);
  
  const headers = Object.keys(data[0]).filter(k => k !== 'id' && k !== 'userId');
  const body = data.map(item => headers.map(header => {
    const val = item[header];
    if (val === null || val === undefined) return '';
    
    // Format dates specifically if detected
    if (header === 'date' || (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/))) {
      try {
        return format(new Date(val), 'dd MMM yyyy, hh:mm a');
      } catch (e) {
        return String(val);
      }
    }
    
    return String(val);
  }));

  autoTable(doc, {
    startY: currentY + 10,
    head: [headers.map(h => h.charAt(0).toUpperCase() + h.slice(1))],
    body: body,
    theme: 'grid',
    headStyles: { 
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    styles: { 
      fontSize: 9,
      cellPadding: 4,
      overflow: 'linebreak',
      cellWidth: 'auto'
    },
    columnStyles: {
      // Allow more space for notes/categories if they exist
      note: { cellWidth: 'auto' },
      category: { cellWidth: 'auto' }
    },
    alternateRowStyles: { 
      fillColor: [249, 250, 251] 
    },
    margin: { left: 14, right: 14, bottom: 20 }
  });

  // Footer with Page Numbers
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Money Details | Page ${i} of ${totalPages}`, 
      pageWidth / 2, 
      pageHeight - 10, 
      { align: 'center' }
    );
  }

  const capitalizedFilename = filename.charAt(0).toUpperCase() + filename.slice(1);
  doc.save(`${capitalizedFilename}.pdf`);
};
