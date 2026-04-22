import {
  Box,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import {
  ChevronLeft as LeftIcon,
  ChevronRight as RightIcon,
} from '@mui/icons-material'
import FormSection from '../../components/shared/FormSection'
import { useResponsive } from '../../hooks/useResponsive'

interface DrawerSettingsPanelProps {
  drawerPosition: 'left' | 'right'
  drawerWidth: number
  onSetDrawerPosition: (position: 'left' | 'right') => void
  onSetDrawerWidth: (width: number) => void
}

/**
 * Drawer settings panel: position toggle and width slider.
 */
const DrawerSettingsPanel = ({
  drawerPosition,
  drawerWidth,
  onSetDrawerPosition,
  onSetDrawerWidth,
}: DrawerSettingsPanelProps) => {
  const { isMobile } = useResponsive()

  return (
    <FormSection title="Drawer Settings">
      <Stack spacing={isMobile ? 3 : 4}>
        {/* Drawer Position */}
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Drawer Position
          </Typography>
          <ToggleButtonGroup
            value={drawerPosition}
            exclusive
            onChange={(_, value) => value && onSetDrawerPosition(value)}
            fullWidth
            sx={{
              ...(isMobile && {
                '& .MuiToggleButton-root': {
                  flexDirection: 'column',
                  gap: 0.5,
                  py: 1.5
                }
              })
            }}
          >
            <ToggleButton value="left">
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 0.5 : 1,
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <LeftIcon />
                <Typography variant={isMobile ? "caption" : "body2"}>Left Side</Typography>
              </Box>
            </ToggleButton>
            <ToggleButton value="right">
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? 0.5 : 1,
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <Typography variant={isMobile ? "caption" : "body2"}>Right Side</Typography>
                <RightIcon />
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Drawer Width */}
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Drawer Width: {drawerWidth}px
          </Typography>
          <Slider
            value={drawerWidth}
            onChange={(_, value) => onSetDrawerWidth(value as number)}
            min={400}
            max={1200}
            step={50}
            marks={[
              { value: 400, label: isMobile ? '' : 'Compact' },
              { value: 600, label: isMobile ? '' : 'Default' },
              { value: 800, label: isMobile ? '' : 'Wide' },
              { value: 1000, label: isMobile ? '' : 'Extra Wide' },
              { value: 1200, label: isMobile ? '' : 'Maximum' },
            ]}
            sx={{
              mt: 2,
              mb: 1,
              ...(isMobile && {
                '& .MuiSlider-markLabel': {
                  fontSize: '0.75rem'
                }
              })
            }}
          />
          {isMobile && (
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mt: 1,
              px: 1
            }}>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                Compact
              </Typography>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                Default
              </Typography>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                Wide
              </Typography>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                Extra
              </Typography>
              <Typography variant="caption" sx={{
                color: "text.secondary"
              }}>
                Max
              </Typography>
            </Box>
          )}
        </Box>
      </Stack>
    </FormSection>
  )
}

export default DrawerSettingsPanel
