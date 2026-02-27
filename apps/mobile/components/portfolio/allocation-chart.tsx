import { View, Text, Dimensions, Pressable } from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import { Canvas, Path, Skia, Group } from '@shopify/react-native-skia';
import { TokenAllocation } from '@/hooks/use-portfolio-metrics';

interface AllocationChartProps {
  allocations: TokenAllocation[];
  totalValue: number;
  size?: number;
  strokeWidth?: number;
  onSegmentPress?: (allocation: TokenAllocation | null) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export function AllocationChart({
  allocations,
  totalValue,
  size: propSize,
  strokeWidth = 24,
  onSegmentPress,
}: AllocationChartProps) {
  const size = propSize ?? Math.min(SCREEN_WIDTH - 80, 220);
  const [selectedSegment, setSelectedSegment] = useState<TokenAllocation | null>(null);

  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;

  // Build donut segments
  const segments = useMemo(() => {
    if (allocations.length === 0) return [];

    const gap = 0.02; // Small gap between segments (in radians)
    const totalGap = gap * allocations.length;
    const availableArc = 2 * Math.PI - totalGap;

    let currentAngle = -Math.PI / 2; // Start at top
    const result: {
      allocation: TokenAllocation;
      path: ReturnType<typeof Skia.Path.Make>;
      startAngle: number;
      endAngle: number;
    }[] = [];

    for (const allocation of allocations) {
      const sweepAngle = (allocation.percentage / 100) * availableArc;
      const endAngle = currentAngle + sweepAngle;

      const path = Skia.Path.Make();

      // Calculate arc points
      const startX = centerX + radius * Math.cos(currentAngle);
      const startY = centerY + radius * Math.sin(currentAngle);

      path.moveTo(startX, startY);
      path.arcToOval(
        {
          x: centerX - radius,
          y: centerY - radius,
          width: radius * 2,
          height: radius * 2,
        },
        (currentAngle * 180) / Math.PI,
        (sweepAngle * 180) / Math.PI,
        false
      );

      result.push({
        allocation,
        path,
        startAngle: currentAngle,
        endAngle,
      });

      currentAngle = endAngle + gap;
    }

    return result;
  }, [allocations, radius, centerX, centerY]);

  const handleTouch = useCallback(
    (event: { nativeEvent: { locationX: number; locationY: number } }) => {
      const { locationX, locationY } = event.nativeEvent;

      // Calculate distance from center
      const dx = locationX - centerX;
      const dy = locationY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check if touch is within the donut ring
      const innerRadius = radius - strokeWidth / 2;
      const outerRadius = radius + strokeWidth / 2;

      if (distance < innerRadius || distance > outerRadius) {
        // Touched center or outside - deselect
        setSelectedSegment(null);
        onSegmentPress?.(null);
        return;
      }

      // Calculate angle of touch
      let touchAngle = Math.atan2(dy, dx);
      if (touchAngle < -Math.PI / 2) {
        touchAngle += 2 * Math.PI;
      }

      // Find which segment was touched
      for (const segment of segments) {
        let { startAngle, endAngle } = segment;
        // Normalize angles for comparison
        if (startAngle < -Math.PI / 2) startAngle += 2 * Math.PI;
        if (endAngle < -Math.PI / 2) endAngle += 2 * Math.PI;

        if (touchAngle >= startAngle && touchAngle <= endAngle) {
          setSelectedSegment(segment.allocation);
          onSegmentPress?.(segment.allocation);
          return;
        }
      }

      // No segment found
      setSelectedSegment(null);
      onSegmentPress?.(null);
    },
    [centerX, centerY, radius, strokeWidth, segments, onSegmentPress]
  );

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  // Determine what to show in center
  const centerDisplay = selectedSegment
    ? {
        label: selectedSegment.token.symbol,
        value: formatCurrency(selectedSegment.usdValue),
        percentage: `${selectedSegment.percentage.toFixed(1)}%`,
      }
    : {
        label: 'Total Value',
        value: formatCurrency(totalValue),
        percentage: null,
      };

  if (allocations.length === 0) {
    return (
      <View style={{ width: size, height: size }} className="items-center justify-center">
        <Text className="text-wallet-text-muted text-sm">No allocation data</Text>
      </View>
    );
  }

  return (
    <Pressable onPress={handleTouch} style={{ width: size, height: size }}>
      <Canvas style={{ width: size, height: size }}>
        <Group>
          {segments.map((segment, index) => (
            <Path
              key={index}
              path={segment.path}
              style="stroke"
              strokeWidth={
                selectedSegment?.token.symbol === segment.allocation.token.symbol
                  ? strokeWidth + 6
                  : strokeWidth
              }
              color={segment.allocation.color}
              strokeCap="round"
            />
          ))}
        </Group>
      </Canvas>

      {/* Center text */}
      <View
        className="absolute items-center justify-center"
        style={{
          top: strokeWidth + 10,
          left: strokeWidth + 10,
          right: strokeWidth + 10,
          bottom: strokeWidth + 10,
        }}
      >
        <Text className="text-wallet-text-muted text-xs">{centerDisplay.label}</Text>
        <Text className="text-wallet-text text-xl font-semibold mt-1">{centerDisplay.value}</Text>
        {centerDisplay.percentage && (
          <Text className="text-wallet-accent text-sm font-medium mt-0.5">
            {centerDisplay.percentage}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
