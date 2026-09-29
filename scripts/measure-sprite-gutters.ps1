param(
  [Parameter(Mandatory=$true)][string]$ImagePath,
  [Parameter(Mandatory=$true)][string]$ReportPath,
  [int]$RowCount = 4
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Collections.Generic;
public static class SpriteGutters {
 static int[] Splits(int[] projection, int count) {
  var edges=new int[count+1]; edges[count]=projection.Length;
  for(int i=1;i<count;i++) {
   int ideal=(int)Math.Round((double)projection.Length*i/count), radius=(int)(projection.Length*0.12);
   int best=ideal, bestCost=int.MaxValue; double bestDistance=double.MaxValue;
   for(int x=Math.Max(1,ideal-radius);x<Math.Min(projection.Length-1,ideal+radius);x++) {
    int cost=projection[x-1]+projection[x]; double distance=Math.Abs(x-ideal);
    if(cost<bestCost || (cost==bestCost && distance<bestDistance)) {best=x;bestCost=cost;bestDistance=distance;}
   }
   // Center within the selected clear gutter for resilient source metadata.
   if(bestCost==0) {int a=best-1,b=best;while(a>0&&projection[a-1]==0)a--;while(b<projection.Length-1&&projection[b+1]==0)b++;best=(a+b+1)/2;}
   edges[i]=best;
  }
  return edges;
 }
 public static object Analyze(string path,int rowCount) {
  using(var bitmap=new Bitmap(path)) {
   var data=bitmap.LockBits(new Rectangle(0,0,bitmap.Width,bitmap.Height),ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);
   var bytes=new byte[data.Stride*bitmap.Height];Marshal.Copy(data.Scan0,bytes,0,bytes.Length);bitmap.UnlockBits(data);
   int[] yp=new int[bitmap.Height];int source=0,transparent=0,partial=0;
   for(int y=0;y<bitmap.Height;y++)for(int x=0;x<bitmap.Width;x++){int alpha=bytes[y*data.Stride+x*4+3];if(alpha==0)transparent++;if(alpha>0&&alpha<255)partial++;if(alpha>=32){yp[y]++;source++;}}
   int[] rows=Splits(yp,rowCount);var rowColumns=new List<int[]>();var frames=new List<object>();int assigned=0,cut=0,empty=0;
   for(int r=0;r<rowCount;r++) {
    var xp=new int[bitmap.Width];for(int y=rows[r];y<rows[r+1];y++)for(int x=0;x<bitmap.Width;x++)if(bytes[y*data.Stride+x*4+3]>=32)xp[x]++;
    int[] columns=Splits(xp,4);rowColumns.Add(columns);
    for(int c=0;c<4;c++) {
     int x0=columns[c],x1=columns[c+1],y0=rows[r],y1=rows[r+1],left=x1,top=y1,right=-1,bottom=-1,pixels=0,edge=0;
     for(int y=y0;y<y1;y++)for(int x=x0;x<x1;x++)if(bytes[y*data.Stride+x*4+3]>=32){pixels++;left=Math.Min(left,x);right=Math.Max(right,x);top=Math.Min(top,y);bottom=Math.Max(bottom,y);if(x==x0||x==x1-1||y==y0||y==y1-1)edge++;}
     assigned+=pixels;cut+=edge;if(pixels==0)empty++;
     frames.Add(new{index=r*4+c,x=left,y=top,width=right-left+1,height=bottom-top+1,pixels=pixels,edgePixels=edge,sourceRect=new[]{x0,y0,x1-x0,y1-y0}});
    }
   }
   return new {width=bitmap.Width,height=bitmap.Height,alphaThreshold=32,rows=rows,columns=rowColumns[0],rowColumns=rowColumns,sourcePixels=source,assignedPixels=assigned,cellEdgePixels=cut,emptyFrames=empty,fullyTransparentPixels=transparent,intermediateAlphaPixels=partial,frames=frames};
  }
 }
}
'@
$sourcePath = (Resolve-Path -LiteralPath $ImagePath).Path
$report = [SpriteGutters]::Analyze($sourcePath,$RowCount)
$reportJson = $report | ConvertTo-Json -Depth 8
[IO.File]::WriteAllText([IO.Path]::GetFullPath($ReportPath),$reportJson,[Text.UTF8Encoding]::new($false))
$report | Select-Object width,height,sourcePixels,assignedPixels,cellEdgePixels,emptyFrames,rows,rowColumns | ConvertTo-Json -Depth 5
if($report.sourcePixels -ne $report.assignedPixels -or $report.cellEdgePixels -ne 0 -or $report.emptyFrames -ne 0) { exit 1 }
