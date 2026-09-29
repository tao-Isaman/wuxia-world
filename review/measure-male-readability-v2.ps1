$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;using System.Drawing;using System.Drawing.Imaging;using System.Runtime.InteropServices;using System.Collections.Generic;
public static class MaleFamilyAudit {
 static int[] Edges(int[] p,int cells){var e=new int[cells+1];e[cells]=p.Length;
  for(int c=1;c<cells;c++){int target=(int)Math.Round((double)c*p.Length/cells),best=-1,distance=int.MaxValue;
   int radius=p.Length/cells/3;
   for(int x=Math.Max(1,target-radius);x<Math.Min(p.Length-1,target+radius);x++)
    if(p[x]==0&&p[x-1]==0&&Math.Abs(x-target)<distance){best=x;distance=Math.Abs(x-target);}
   e[c]=best<0?target:best;}return e;}
 public static object Read(string path,int rowCount){using(var b=new Bitmap(path)){
  var d=b.LockBits(new Rectangle(0,0,b.Width,b.Height),ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);
  var p=new byte[d.Stride*b.Height];Marshal.Copy(d.Scan0,p,0,p.Length);b.UnlockBits(d);
  var xp=new int[b.Width];var yp=new int[b.Height];int pixels=0,transparent=0,faint=0,partial=0,opaque=0;
  for(int y=0;y<b.Height;y++)for(int x=0;x<b.Width;x++){int a=p[y*d.Stride+x*4+3];
   if(a==0)transparent++;else if(a<32)faint++;else if(a<255)partial++;else opaque++;
   if(a>=32){xp[x]++;yp[y]++;pixels++;}}
  var columns=Edges(xp,4);var rows=Edges(yp,rowCount);var frames=new List<object>();int assigned=0,edge=0,outer=0;
  for(int r=0;r<rowCount;r++)for(int c=0;c<4;c++){int l=columns[c+1],t=rows[r+1],right=-1,bottom=-1,n=0,ep=0;
   for(int y=rows[r];y<rows[r+1];y++)for(int x=columns[c];x<columns[c+1];x++)if(p[y*d.Stride+x*4+3]>=32){
    n++;l=Math.Min(l,x);t=Math.Min(t,y);right=Math.Max(right,x);bottom=Math.Max(bottom,y);
    if(x==columns[c]||x==columns[c+1]-1||y==rows[r]||y==rows[r+1]-1)ep++;
    if(x==0||x==b.Width-1||y==0||y==b.Height-1)outer++;}
   assigned+=n;edge+=ep;frames.Add(new{index=r*4+c,x=l,y=t,width=right-l+1,height=bottom-t+1,pixels=n,edgePixels=ep});}
  var emptyX=new List<int[]>();var emptyY=new List<int[]>();
  foreach(int a in new[]{0,1}){var projection=a==0?xp:yp;var empty=a==0?emptyX:emptyY;int start=-1;
   for(int k=0;k<=projection.Length;k++){if(k<projection.Length&&projection[k]==0){if(start<0)start=k;}else if(start>=0){empty.Add(new[]{start,k-1});start=-1;}}}
  return new{width=b.Width,height=b.Height,columns=columns,rows=rows,frameCount=frames.Count,alphaThreshold=32,
   sourcePixels=pixels,assignedPixels=assigned,cellEdgePixels=edge,outerEdgePixels=outer,fullyTransparentPixels=transparent,
   faintAlphaPixels=faint,partialAlphaPixels=partial,fullyOpaquePixels=opaque,emptyColumns=emptyX,emptyRows=emptyY,frames=frames};}}
}
'@
$files=Get-ChildItem -LiteralPath 'public/art/characters' -Filter 'm*-readability-v2*.png' | Sort-Object Name
$report=@(foreach($file in $files){$rows=if($file.Name.EndsWith('-directions.png')){2}else{4};$audit=[MaleFamilyAudit]::Read($file.FullName,$rows);
 [pscustomobject]@{file=$file.Name;sha256=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant();audit=$audit}})
[IO.File]::WriteAllText((Join-Path (Get-Location) 'review/male-readability-v2-source-bounds.json'),($report|ConvertTo-Json -Depth 9),[Text.UTF8Encoding]::new($false))
$report|ForEach-Object{[pscustomobject]@{File=$_.file;Width=$_.audit.width;Height=$_.audit.height;Frames=$_.audit.frameCount;Visible=$_.audit.sourcePixels;Edges=$_.audit.cellEdgePixels;Outer=$_.audit.outerEdgePixels;Columns=($_.audit.columns -join ',');Rows=($_.audit.rows -join ',')}}|Format-Table -AutoSize
if(@($report|Where-Object{$_.audit.cellEdgePixels -gt 0 -or $_.audit.sourcePixels -ne $_.audit.assignedPixels -or @($_.audit.frames|Where-Object pixels -eq 0).Count -gt 0}).Count){exit 1}
