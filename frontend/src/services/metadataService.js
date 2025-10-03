class MetadataService {
    buildMetadata(formData) {
        const metadata = {
            c: formData.currencyCode,
            n: formData.name,
            d: formData.description
        };

        if (formData.iconUrl) metadata.i = formData.iconUrl;
        if (formData.assetClass) metadata.cl = formData.assetClass;
        if (formData.assetSubclass) metadata.cs = formData.assetSubclass;
        if (formData.name) metadata.a = formData.name;

        if (formData.weblinks.length > 0) {
            metadata.w = formData.weblinks
                .filter(link => link.url && link.title)
                .map(link => ({
                    u: link.url,
                    c: link.category,
                    t: link.title
                }));
        }

        const jsonStr = JSON.stringify(metadata);
        const encoder = new TextEncoder();
        const bytes = encoder.encode(jsonStr);
        const hexMetadata = Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();

        if (hexMetadata.length > 2048) {
            throw new Error(`Metadata too large: ${hexMetadata.length / 2} bytes (max 1024 bytes)`);
        }

        return hexMetadata;
    }

    parseMetadata(hexString) {
        if (!hexString || hexString === '') {
            return null;
        }

        try {
            // Convert hex string to bytes
            const bytes = [];
            for (let i = 0; i < hexString.length; i += 2) {
                bytes.push(parseInt(hexString.substr(i, 2), 16));
            }
            
            // Convert bytes to string
            const decoder = new TextDecoder();
            const jsonStr = decoder.decode(new Uint8Array(bytes));
            
            // Parse JSON
            const metadata = JSON.parse(jsonStr);
            
            // Return formatted metadata
            return {
                currencyCode: metadata.c || 'Unknown',
                name: metadata.n || metadata.a || 'Unnamed Token',
                description: metadata.d || '',
                iconUrl: metadata.i || '',
                assetClass: metadata.cl || '',
                assetSubclass: metadata.cs || '',
                weblinks: metadata.w || []
            };
        } catch (error) {
            return null;
        }
    }

    getAssetClasses() {
        return [
            { value: 'rwa', label: 'Real World Asset (RWA)' },
            { value: 'stablecoin', label: 'Stablecoin' },
            { value: 'gaming', label: 'Gaming' },
            { value: 'defi', label: 'DeFi' },
            { value: 'utility', label: 'Utility' },
            { value: 'governance', label: 'Governance' },
            { value: 'nft', label: 'NFT/Collectible' },
            { value: 'other', label: 'Other' }
        ];
    }

    getRWASubclasses() {
        return [
            'private_credit', 'real_estate', 'equity', 'treasury', 'commodity',
            'art', 'intellectual_property', 'carbon_credit', 'other'
        ];
    }

    getStablecoinSubclasses() {
        return [
            'fiat_backed', 'crypto_backed', 'algorithmic', 'commodity_backed'
        ];
    }

    getWeblinkCategories() {
        return [
            { value: 'website', label: 'Official Website' },
            { value: 'docs', label: 'Documentation' },
            { value: 'whitepaper', label: 'Whitepaper' },
            { value: 'github', label: 'GitHub' },
            { value: 'twitter', label: 'Twitter/X' },
            { value: 'discord', label: 'Discord' },
            { value: 'telegram', label: 'Telegram' },
            { value: 'medium', label: 'Medium/Blog' }
        ];
    }
}

export const metadataService = new MetadataService();
export default MetadataService;