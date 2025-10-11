/**
 * AI Panel Component
 * Sales assistant with hardcoded API key for generating talking points
 */

import { useState } from 'react';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Paper,
  Grid,
  Chip,
  IconButton,
} from '@mui/material';
import { Send, Feedback, Add, Close } from '@mui/icons-material';
import { hasApiKey, askSalesPoints } from '../../lib/ai';

interface AIPanelProps {
  context?: {
    dimensions: string;
    pitch: string;
    cladding: string;
    sprayTotal: string;
  };
}

const DEFAULT_PRESETS = [
  'Condensation',
  'Rust',
  'Roof Only',
  'Reflective Foil',
  'Foil Board',
  'Summer Heat',
  'Winter Cold',
  'Anti-con',
  'Too Expensive',
  'Can DIY',
  'Fire',
  'Air-Cell',
  'Batt Walls',
  'Vapour Barrier',
  'Air Barrier',
  'Leaking',
  'Noisy',
];

export default function AIPanel({ context }: AIPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [customPresets, setCustomPresets] = useState<string[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [showAddPreset, setShowAddPreset] = useState(false);

  const keyConfigured = hasApiKey();
  const allPresets = [...DEFAULT_PRESETS, ...customPresets];

  const togglePreset = (preset: string) => {
    setSelectedPresets((prev) =>
      prev.includes(preset) ? prev.filter((p) => p !== preset) : [...prev, preset]
    );
  };

  const addCustomPreset = () => {
    if (newPresetName.trim() && !allPresets.includes(newPresetName.trim())) {
      setCustomPresets((prev) => [...prev, newPresetName.trim()]);
      setNewPresetName('');
      setShowAddPreset(false);
    }
  };

  const removeCustomPreset = (preset: string) => {
    setCustomPresets((prev) => prev.filter((p) => p !== preset));
    setSelectedPresets((prev) => prev.filter((p) => p !== preset));
  };

  const handleGenerateSalesPoints = async () => {
    if (!keyConfigured) {
      setError('OpenAI API key not configured. Please contact your administrator.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Combine selected presets as bullet points for clear separation
      const presetBullets = selectedPresets.length > 0
        ? selectedPresets.map(p => `• ${p}`).join('\n')
        : '';

      const customPrompt = prompt.trim();

      // Combine with line breaks to keep topics distinct
      const combinedPrompt = [presetBullets, customPrompt]
        .filter(Boolean)
        .join('\n\n');

      const result = await askSalesPoints({
        context: context || { dimensions: 'N/A', pitch: 'N/A', cladding: 'N/A', sprayTotal: 'N/A' },
        prompt: combinedPrompt || undefined,
      });

      // Extract just the statements without sales fluff
      const cleanedResponse = result.variants
        .map(v => v.replace(/^[•\-*]\s*/, '').replace(/^\*\*.*?\*\*:\s*/, ''))
        .join('\n\n');

      setResponse(cleanedResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate sales points');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = () => {
    console.log('Feedback submitted:', feedbackText);
    alert(`Feedback submitted: ${feedbackText}`);
    setFeedbackText('');
    setFeedbackOpen(false);
  };

  return (
    <Card elevation={1} sx={{ p: 3 }}>
      {/* FEEDBACK BUTTON - Priority at top */}
      <Box sx={{ mb: 3 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<Feedback />}
          onClick={() => setFeedbackOpen(!feedbackOpen)}
          sx={{ fontWeight: 'bold' }}
        >
          Report Calculation Issue + Update Sales Responses
        </Button>
      </Box>

      {/* Feedback Text Box */}
      {feedbackOpen && (
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'error.light', mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
            Describe the calculation issue or update sales responses:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Enter details about what's wrong with the calculation or how to improve sales responses..."
            sx={{ mb: 2, bgcolor: 'white' }}
          />
          <Button
            variant="contained"
            color="error"
            onClick={handleFeedbackSubmit}
            disabled={!feedbackText.trim()}
          >
            Submit Feedback
          </Button>
        </Paper>
      )}

      <Typography variant="h3" gutterBottom>
        Sales Assistant
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select topics and generate sales talking points
      </Typography>

      <Stack spacing={3}>
        {/* Preset Buttons */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">
              Quick Topics:
            </Typography>
            <Button
              size="small"
              startIcon={<Add />}
              onClick={() => setShowAddPreset(!showAddPreset)}
            >
              Add Topic
            </Button>
          </Box>

          {/* Add Custom Preset Input */}
          {showAddPreset && (
            <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                fullWidth
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="Enter custom topic..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addCustomPreset();
                  }
                }}
              />
              <Button variant="contained" onClick={addCustomPreset} disabled={!newPresetName.trim()}>
                Add
              </Button>
            </Box>
          )}

          {/* Preset Chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {allPresets.map((preset) => {
              const isCustom = customPresets.includes(preset);
              const isSelected = selectedPresets.includes(preset);

              return (
                <Chip
                  key={preset}
                  label={preset}
                  onClick={() => togglePreset(preset)}
                  onDelete={isCustom ? () => removeCustomPreset(preset) : undefined}
                  deleteIcon={isCustom ? <Close /> : undefined}
                  color={isSelected ? 'primary' : 'default'}
                  variant={isSelected ? 'filled' : 'outlined'}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: isSelected ? 'primary.dark' : 'action.hover',
                    },
                  }}
                />
              );
            })}
          </Box>
        </Box>

        {/* Custom Question/Prompt Input */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Additional Questions or Context:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Add any specific questions or additional context here..."
            disabled={!keyConfigured || loading}
            sx={{ bgcolor: 'background.paper' }}
          />
        </Box>

        {/* Generate Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={handleGenerateSalesPoints}
          disabled={!keyConfigured || loading || (selectedPresets.length === 0 && !prompt.trim())}
          startIcon={loading ? <CircularProgress size={20} /> : <Send />}
          sx={{ minHeight: 48 }}
        >
          {loading ? 'Generating...' : 'Generate Sales Points'}
        </Button>

        {/* Error Display */}
        {error && <Alert severity="error">{error}</Alert>}

        {/* Response Display - Fixed sizing, stays in view */}
        {response && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: 'background.default',
              maxHeight: '400px',
              overflow: 'auto',
            }}
          >
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Sales Points:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8,
              }}
            >
              {response}
            </Typography>
          </Paper>
        )}

        {!keyConfigured && (
          <Alert severity="warning">
            OpenAI API key not configured. Please contact your system administrator to enable the
            sales assistant.
          </Alert>
        )}
      </Stack>
    </Card>
  );
}
