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