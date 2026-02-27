import { View, Text, Dimensions } from 'react-native';
import { useState, useMemo, useCallback } from 'react';
import {
  Canvas,
  Path,
  Skia,
  Line,
  Circle,
  vec,
} from '@shopify/react-native-skia';
import { ChartDataPoint } from '@/types/coingecko';

interface PriceChartProps {
  data: ChartDataPoint[];
  minPrice: number;
  maxPrice: number;
  isPositive: boolean;
  width?: number;
  height?: number;
}

const PADDING = { top: 10, bottom: 10, left: 0, right: 0 };

export function PriceChart({
  data,
  minPrice,
  maxPrice,
  isPositive,
  width: propWidth,
  height = 180,
}: PriceChartProps) {
  const screenWidth = Dimensions.get('window').width;
  const width = propWidth ?? screenWidth - 120;

  const [touchPoint, setTouchPoint] = useState<{
    x: number;
    y: number;
    price: number;
    timestamp: number;
  } | null>(null);

  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;

  const lineColor = isPositive ? '#34C759' : '#FF3B30';

  // Build the line path and grid lines
  const { linePath, points, gridLines } = useMemo(() => {
    if (data.length < 2) {
      return { linePath: null, points: [], gridLines: [] };
    }

    const priceRange = maxPrice - minPrice || 1;
    const calculatedPoints: { x: number; y: number; price: number; timestamp: number }[] = [];

    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      const x = PADDING.left + (i / (data.length - 1)) * chartWidth;
      const normalizedPrice = (point.price - minPrice) / priceRange;
      const y = PADDING.top + chartHeight - normalizedPrice * chartHeight;

      calculatedPoints.push({
        x,
        y,
        price: point.price,
        timestamp: point.timestamp,
      });
    }

    const line = Skia.Path.Make();
    line.moveTo(calculatedPoints[0].x, calculatedPoints[0].y);
    for (let i = 1; i < calculatedPoints.length; i++) {
      line.lineTo(calculatedPoints[i].x, calculatedPoints[i].y);
    }

    const numGridLines = 4;
    const gridLinesArray = [];
    for (let i = 0; i <= numGridLines; i++) {
      const y = PADDING.top + (i / numGridLines) * chartHeight;
      gridLinesArray.push({ y, x1: PADDING.left, x2: PADDING.left + chartWidth });
    }

    return { linePath: line, points: calculatedPoints, gridLines: gridLinesArray };
  }, [data, minPrice, maxPrice, chartWidth, chartHeight]);

  const findClosestPoint = useCallback(
    (touchX: number) => {
      if (points.length === 0) return null;

      let closestPoint = points[0];
      let closestDistance = Math.abs(touchX - closestPoint.x);

      for (const point of points) {
        const distance = Math.abs(touchX - point.x);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPoint = point;
        }
      }

      return closestPoint;
    },
    [points]
  );

  const handleTouchStart = useCallback(
    (event: { nativeEvent: { locationX: number } }) => {
      const point = findClosestPoint(event.nativeEvent.locationX);
      setTouchPoint(point);
    },
    [findClosestPoint]
  );

  const handleTouchMove = useCallback(
    (event: { nativeEvent: { locationX: number } }) => {
      const point = findClosestPoint(event.nativeEvent.locationX);
      setTouchPoint(point);
    },
    [findClosestPoint]
  );

  const handleTouchEnd = useCallback(() => {
    setTouchPoint(null);
  }, []);

  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
    } else if (price >= 1) {
      return price.toFixed(2);
    } else {
      return price.toFixed(4);
    }
  };

  if (!linePath || data.length < 2) {
    return (
      <View style={{ width, height }} className="items-center justify-center">
        <Text className="text-wallet-text-muted text-sm">No chart data available</Text>
      </View>
    );
  }

  return (
    <View style={{ width, height }}>
      {/* Touch price tooltip */}
      {touchPoint && (
        <View
          className="absolute z-10 bg-wallet-accent px-3 py-1.5 rounded-lg"
          style={{
            left: Math.min(Math.max(touchPoint.x - 35, 0), width - 70),
            top: Math.max(touchPoint.y - 40, 0),
          }}
        >
          <Text className="text-black text-xs font-semibold">{formatPrice(touchPoint.price)}</Text>
        </View>
      )}

      <View
        style={{ width, height }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <Canvas style={{ width, height }}>
          {/* Grid lines */}
          {gridLines.map((line, index) => (
            <Line
              key={index}
              p1={vec(line.x1, line.y)}
              p2={vec(line.x2, line.y)}
              color="#2C2C2E"
              strokeWidth={1}
              style="stroke"
            />
          ))}

          {/* Main line */}
          <Path
            path={linePath}
            style="stroke"
            strokeWidth={2}
            color={lineColor}
            strokeCap="round"
            strokeJoin="round"
          />

          {/* Touch indicator */}
          {touchPoint && (
            <>
              {/* Vertical line */}
              <Line
                p1={vec(touchPoint.x, PADDING.top)}
                p2={vec(touchPoint.x, height - PADDING.bottom)}
                color="#5C6660"
                strokeWidth={1}
                style="stroke"
              />
              {/* Dot */}
              <Circle cx={touchPoint.x} cy={touchPoint.y} r={6} color={lineColor} />
              <Circle cx={touchPoint.x} cy={touchPoint.y} r={3} color="#FFFFFF" />
            </>
          )}
        </Canvas>
      </View>
    </View>
  );
}
