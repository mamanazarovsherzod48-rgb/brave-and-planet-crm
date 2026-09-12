import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";

export const generateStudentReportDocx = async (title, studentList) => {
  const tableRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: "№", bold: true })], width: { size: 5, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ text: "F.I.SH", bold: true })], width: { size: 35, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ text: "Telefon", bold: true })], width: { size: 25, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ text: "Guruh", bold: true })], width: { size: 20, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ text: "Status", bold: true })], width: { size: 15, type: WidthType.PERCENTAGE } }),
      ],
    }),
    ...studentList.map((st, idx) => 
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(`${idx + 1}`)] }),
          new TableCell({ children: [new Paragraph(st.full_name || "")] }),
          new TableCell({ children: [new Paragraph(st.phone || st.parent_phone || "-")] }),
          new TableCell({ children: [new Paragraph(st.groups?.name || "Guruhsiz")] }),
          new TableCell({ children: [new Paragraph(st.status === 'graduated' ? 'Bitirgan' : 'Faol')] }),
        ],
      })
    ),
  ];

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: title || "Eduflow CRM - O'quvchilar Hisoboti",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }),
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Hisobot_${new Date().toISOString().slice(0, 10)}.docx`);
};