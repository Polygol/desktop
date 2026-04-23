// rename.js - Sequential Batch Renaming
export async function run(files, ctx) {
    const pattern = await ctx.prompt(
        "Enter new name pattern.\nUse '#' for sequence number (e.g. Vacation_#)", 
        "Smart Rename", 
        "File_#"
    );
    
    if (!pattern) return;

    ctx.popup("Renaming...");
    
    files.forEach((file, i) => {
        const extension = file.name.split('.').pop();
        const number = (i + 1).toString().padStart(2, '0');
        
        // Replace '#' with the number, or append it if no '#' exists
        let newBaseName = pattern.includes('#') 
            ? pattern.replace('#', number) 
            : `${pattern}_${number}`;
            
        ctx.download(`${newBaseName}.${extension}`, URL.createObjectURL(file));
    });
    
    ctx.notify(`Processed ${files.length} files`, "Rename Task", "drive_file_rename_outline");
}