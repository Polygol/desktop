export async function run(files, ctx) {
    const targetFormat = await ctx.prompt("Enter target format (webp, png, jpg):", "Lossless Convert", "webp");
    if (!targetFormat) return;

    const mimeMap = { 'webp': 'image/webp', 'png': 'image/png', 'jpg': 'image/jpeg' };
    const targetMime = mimeMap[targetFormat.toLowerCase()];
    
    if (!targetMime) return ctx.alert("Invalid format specified.");

    ctx.popup(`Converting ${files.length} files...`);

    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;

        const bitmap = await createImageBitmap(file);
        const canvas = (typeof OffscreenCanvas !== 'undefined') 
            ? new OffscreenCanvas(bitmap.width, bitmap.height)
            : document.createElement('canvas');
            
        if (!(canvas instanceof OffscreenCanvas)) {
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
        }

        const g = canvas.getContext('2d');
        g.drawImage(bitmap, 0, 0);

        // Quality 1.0 = Lossless for WEBP and PNG. Maximum for JPG.
        const blob = await (canvas instanceof OffscreenCanvas 
            ? canvas.convertToBlob({ type: targetMime, quality: 1.0 })
            : new Promise(res => canvas.toBlob(res, targetMime, 1.0)));

        const newName = file.name.substring(0, file.name.lastIndexOf('.')) + '.' + targetFormat;
        ctx.download(newName, URL.createObjectURL(blob));
        bitmap.close();
    }
    ctx.notify("Finished converting images", "Conversion Task", "done_all");
}