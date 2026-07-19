export function emailTemplate({
  title,
  subtitle,
  content,
  buttonText,
  buttonLink,
  buttons,
  footer,
}: {
  title: string;
  subtitle?: string;
  content: string;

  buttonText?: string;
  buttonLink?: string;

  buttons?: {
    text: string;
    url: string;
    color?: "blue" | "pink" | "gray";
  }[];

  footer?: string;
}) {
  const colors = {
    blue: "#5B8DEF",
    pink: "#F472B6",
    gray: "#94A3B8",
  };

  return `
<!DOCTYPE html>
<html lang="pt-BR">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body
style="
margin:0;
padding:40px 20px;
background:#F8FAFC;
font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
">

<table
align="center"
width="100%"
style="
max-width:600px;
background:#FFFFFF;
border-radius:18px;
overflow:hidden;
border:1px solid #E2E8F0;
box-shadow:0 10px 30px rgba(15,23,42,.08);
">

<tr>
<td
style="
background:linear-gradient(135deg,#5B8DEF,#F472B6);
padding:28px;
text-align:center;
">

<h1
style="
margin:0;
font-size:28px;
font-weight:700;
color:#FFFFFF;
">
🎉 Gerenciador de Festas
</h1>

</td>
</tr>

<tr>

<td style="padding:40px;">

<h2
style="
margin:0;
margin-bottom:12px;
font-size:28px;
font-weight:700;
color:#334155;
">
${title}
</h2>

${
  subtitle
    ? `
<p
style="
margin:0 0 24px;
font-size:17px;
color:#64748B;
">
${subtitle}
</p>
`
    : ""
}

<div
style="
font-size:16px;
line-height:1.8;
color:#475569;
">
${content}
</div>

${
  buttons?.length
    ? `
<div style="margin-top:35px;">

${buttons
  .map(
    (button) => `
<div
style="
display:flex;
align-items:center;
gap:16px;
padding:16px 0;
border-bottom:1px solid #E2E8F0;
">

<a
href="${button.url}"
style="
display:inline-block;
padding:14px 22px;
background:${colors[button.color ?? "blue"]};
color:#FFFFFF;
text-decoration:none;
border-radius:10px;
font-size:15px;
font-weight:600;
white-space:nowrap;
">
${button.text}
</a>

<div
style="
font-size:15px;
line-height:1.6;
color:#475569;
flex:1;
">
${
  button.text === "Cancelar contrato"
    ? "Encerra definitivamente o contrato e libera os itens do estoque."
    : button.text === "Arquivar contrato"
      ? "Encerra o contrato preservando todo o histórico para consultas futuras."
      : "Nenhuma alteração é realizada e o contrato permanece com status <strong>LATE</strong>."
}
</div>

</div>
`
  )
  .join("")}

</div>
`
    : buttonLink
      ? `
<div
style="
margin-top:35px;
text-align:center;
">

<a
href="${buttonLink}"
style="
display:inline-block;
padding:16px 34px;
background:linear-gradient(135deg,#5B8DEF,#F472B6);
color:#FFFFFF;
text-decoration:none;
border-radius:12px;
font-size:16px;
font-weight:700;
box-shadow:0 10px 20px rgba(91,141,239,.25);
">
${buttonText}
</a>

<p
style="
margin-top:24px;
font-size:13px;
color:#64748B;
">
Caso o botão não funcione, copie o link abaixo:
</p>

<div
style="
background:#F1F5F9;
border:1px solid #E2E8F0;
padding:14px;
border-radius:10px;
word-break:break-all;
font-size:13px;
color:#475569;
">
${buttonLink}
</div>

</div>
`
      : ""
}

</td>

</tr>

<tr>

<td
style="
padding:24px;
background:#F8FAFC;
border-top:1px solid #E2E8F0;
text-align:center;
font-size:13px;
color:#94A3B8;
line-height:1.7;
">

${
  footer ??
  `
Este e-mail foi enviado automaticamente.<br>
© ${new Date().getFullYear()} Gerenciador de Festas
`
}

</td>

</tr>

</table>

</body>

</html>
`;
}
