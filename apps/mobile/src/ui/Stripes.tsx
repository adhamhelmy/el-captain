import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

/** The web's diagonal stripe pattern (`--stripes`) filling its parent. */
export function Stripes() {
  const { colors } = useTheme();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="stripes" width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <Rect width="18" height="36" fill={colors.stripeA} />
            <Rect x="18" width="18" height="36" fill={colors.stripeB} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#stripes)" />
      </Svg>
    </View>
  );
}
