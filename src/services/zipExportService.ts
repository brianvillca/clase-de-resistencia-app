import JSZip from 'jszip';
import { CSHARP_CODE_FILES } from '../data/csharpCodeFiles';

export async function descargarProyectoCompletoZip(): Promise<void> {
  const zip = new JSZip();

  // Crear la estructura de carpetas en el zip
  for (const file of CSHARP_CODE_FILES) {
    zip.file(`EmpresaProductos/${file.path}`, file.content);
  }

  // Agregar archivo de solución .sln para abrir con Visual Studio directamente
  const slnContent = `
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.0.31903.59
MinimumVisualStudioVersion = 10.0.40219.1
Project("{9A19103F-16F7-4668-BE54-9A1E7A4F7556}") = "EmpresaProductos", "EmpresaProductos\\EmpresaProductos.csproj", "{B6D20D4D-FB39-45B0-BE3F-E9A88A11D809}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{B6D20D4D-FB39-45B0-BE3F-E9A88A11D809}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{B6D20D4D-FB39-45B0-BE3F-E9A88A11D809}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{B6D20D4D-FB39-45B0-BE3F-E9A88A11D809}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{B6D20D4D-FB39-45B0-BE3F-E9A88A11D809}.Release|Any CPU.Build.0 = Release|Any CPU
	EndGlobalSection
EndGlobal
`.trim();

  zip.file('EmpresaProductos.sln', slnContent);

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'EmpresaProductos_CSharp_Razor_SQLServer.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
