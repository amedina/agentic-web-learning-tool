function getToolNameWithoutPrefix(toolName: string){
    const websiteToolNamePrefix = 'website_tool_';
    // Incase we decide to add some tools from extension
    const extensionToolNamePrefix = 'extension_tool_';
    let toolNameWithoutHardCodePrefix = '';

    if(toolName.startsWith(websiteToolNamePrefix)){
        toolNameWithoutHardCodePrefix = toolName.substring(websiteToolNamePrefix.length-1);
        toolNameWithoutHardCodePrefix.split('_');
        const pieces = toolNameWithoutHardCodePrefix.split('_');
        pieces.shift();
        return pieces.join('_').match(/_tab[^_]+_(.+)$/)?.[1];
    }

    if(toolName.startsWith(extensionToolNamePrefix)){
        toolNameWithoutHardCodePrefix = toolName.substring(extensionToolNamePrefix.length-1);
        const pieces = toolNameWithoutHardCodePrefix.split('_');
        pieces.shift();
        return pieces.join('_').match(/_tab[^_]+_(.+)$/)?.[1];
    }

    return toolName;
}

export default getToolNameWithoutPrefix;