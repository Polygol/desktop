import { zipSync, unzipSync, strToU8, strFromU8 } from 'https://cdn.skypack.dev/fflate?min';

export async function run(files, ctx) {
    // If only one file and it's a zip, assume UNZIP
    if (files.length === 1 && files[0].name.endsWith('.zip')) {
        ctx.popup("Extracting archive...");
        const buffer = await files[0].arrayBuffer();
        const unzipped = unzipSync(new Uint8Array(buffer));
        
        for (const path in unzipped) {
            const blob = new Blob([unzipped[path]]);
            ctx.download(path, URL.createObjectURL(blob));
        }
        ctx.notify("Extraction complete", "Archive Task", "unarchive");
    } 
    // Otherwise, ZIP files together
    else {
        ctx.popup("Creating ZIP...");
        const zipData = {};
        for (const file of files) {
            zipData[file.name] = new Uint8Array(await file.arrayBuffer());
        }
        
        const zipped = zipSync(zipData, { level: 6 }); // Balanced compression
        const blob = new Blob([zipped], { type: 'application/zip' });
        ctx.download('Archive.zip', URL.createObjectURL(blob));
        ctx.notify("Archive created successfully", "Archive Task", "archive");
    }
}