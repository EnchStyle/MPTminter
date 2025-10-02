import React from 'react';
import {
    Box,
    Typography,
    TextField,
    Grid,
    Card,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const MetadataStep = React.memo(({
    formData,
    setFormData,
    metadataService
}) => {
    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleWeblinkChange = (index, field, value) => {
        const newWeblinks = [...formData.weblinks];
        newWeblinks[index][field] = value;
        setFormData(prev => ({ ...prev, weblinks: newWeblinks }));
    };

    const addWeblink = () => {
        setFormData(prev => ({
            ...prev,
            weblinks: [...prev.weblinks, { url: '', category: 'website', title: '' }]
        }));
    };

    const removeWeblink = (index) => {
        setFormData(prev => ({
            ...prev,
            weblinks: prev.weblinks.filter((_, i) => i !== index)
        }));
    };

    const getSubclasses = () => {
        if (formData.assetClass === 'rwa') return metadataService.getRWASubclasses();
        if (formData.assetClass === 'stablecoin') return metadataService.getStablecoinSubclasses();
        return [];
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Additional Information (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add details to help people understand and trust your token.
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>What type of token is this?</InputLabel>
                        <Select
                            value={formData.assetClass}
                            label="What type of token is this?"
                            onChange={(e) => handleFieldChange('assetClass', e.target.value)}
                        >
                            <MenuItem value="">Select category...</MenuItem>
                            {metadataService.getAssetClasses().map(cls => (
                                <MenuItem key={cls.value} value={cls.value}>
                                    {cls.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {getSubclasses().length > 0 && (
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>More specifically...</InputLabel>
                            <Select
                                value={formData.assetSubclass}
                                label="More specifically..."
                                onChange={(e) => handleFieldChange('assetSubclass', e.target.value)}
                            >
                                <MenuItem value="">Select subclass...</MenuItem>
                                {getSubclasses().map(sub => (
                                    <MenuItem key={sub} value={sub}>
                                        {sub.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                )}

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Token Image (Logo URL)"
                        value={formData.iconUrl}
                        onChange={(e) => handleFieldChange('iconUrl', e.target.value)}
                        placeholder="https://example.com/my-token-logo.png"
                        helperText="Link to your token's logo image (PNG, JPG, or SVG)"
                    />
                </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Important Links (Website, Social Media, etc.)
                </Typography>

                {formData.weblinks.map((link, idx) => (
                    <Card key={idx} variant="outlined" sx={{ mb: 2, p: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="subtitle2">Link {idx + 1}</Typography>
                            <IconButton 
                                onClick={() => removeWeblink(idx)} 
                                color="error" 
                                size="small"
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={link.category}
                                        label="Category"
                                        onChange={(e) => handleWeblinkChange(idx, 'category', e.target.value)}
                                    >
                                        {metadataService.getWeblinkCategories().map(cat => (
                                            <MenuItem key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Link Title"
                                    value={link.title}
                                    onChange={(e) => handleWeblinkChange(idx, 'title', e.target.value)}
                                    placeholder="Link title"
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="URL"
                                    value={link.url}
                                    onChange={(e) => handleWeblinkChange(idx, 'url', e.target.value)}
                                    placeholder="https://..."
                                />
                            </Grid>
                        </Grid>
                    </Card>
                ))}

                <Button
                    variant="outlined"
                    onClick={addWeblink}
                    startIcon={<AddIcon />}
                    sx={{ mt: 2 }}
                >
                    Add Another Link
                </Button>
            </Box>
        </Box>
    );
});

export default MetadataStep;