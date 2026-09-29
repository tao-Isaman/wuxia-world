$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Collections.Generic;
public static class ReadabilityCandidateAlpha {
 public static object Analyze(string path, int[] columns, int[] rows) {
  using (var b = new Bitmap(path)) {
   var data = b.LockBits(new Rectangle(0,0,b.Width,b.Height),ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);
   var p = new byte[data.Stride*b.Height]; Marshal.Copy(data.Scan0,p,0,p.Length); b.UnlockBits(data);
   int[] xp=new int[b.Width], yp=new int[b.Height]; int source=0, transparent=0, intermediate=0;
   for(int y=0;y<b.Height;y++)for(int x=0;x<b.Width;x++) {
    int a=p[y*data.Stride+x*4+3]; if(a==0)transparent++;if(a>0&&a<255)intermediate++;
    if(a>=32){xp[x]++;yp[y]++;source++;}
   }
   var emptyX=new List<int[]>();var emptyY=new List<int[]>();
   foreach(var axis in new[]{0,1}){var proj=axis==0?xp:yp; var empty=axis==0?emptyX:emptyY;int start=-1;
    for(int n=0;n<=proj.Length;n++){if(n<proj.Length&&proj[n]==0){if(start<0)start=n;}else if(start>=0){empty.Add(new[]{start,n-1});start=-1;}}
   }
   var frames=new List<object>();int assigned=0,cut=0;
   for(int r=0;r<4;r++)for(int c=0;c<4;c++){
    int x0=columns[c],x1=columns[c+1],y0=rows[r],y1=rows[r+1];int left=x1,top=y1,right=-1,bottom=-1,count=0,edge=0;
    for(int y=y0;y<y1;y++)for(int x=x0;x<x1;x++)if(p[y*data.Stride+x*4+3]>=32){
     count++; left=Math.Min(left,x);right=Math.Max(right,x);top=Math.Min(top,y);bottom=Math.Max(bottom,y);
     if(x==x0||x==x1-1||y==y0||y==y1-1)edge++;
    }
    assigned+=count;cut+=edge;frames.Add(new{index=r*4+c,x=left,y=top,width=right-left+1,height=bottom-top+1,pixels=count,edgePixels=edge});
   }
   return new{width=b.Width,height=b.Height,columns=columns,rows=rows,alphaThreshold=32,sourcePixels=source,assignedPixels=assigned,cellEdgePixels=cut,fullyTransparentPixels=transparent,intermediateAlphaPixels=intermediate,emptyColumns=emptyX,emptyRows=emptyY,frames=frames};
  }
 }
}
'@
$candidate = Join-Path (Get-Location) 'public/art/characters/m1-readability-v2.png'
$report = [ReadabilityCandidateAlpha]::Analyze($candidate, [int[]]@(0,326,610,920,1199), [int[]]@(0,359,674,970,1312))
$json = $report | ConvertTo-Json -Depth 8
[IO.File]::WriteAllText((Join-Path (Get-Location) 'review/m1-readability-v2-source-bounds.json'),$json,[Text.UTF8Encoding]::new($false))
$json
if ($report.sourcePixels -ne $report.assignedPixels -or $report.cellEdgePixels -ne 0) { exit 1 }
