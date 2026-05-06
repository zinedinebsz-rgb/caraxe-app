import { Composition } from 'remotion';
import { PriceComparison, priceComparisonDefaultProps } from './PriceComparison';
import { WeeklyTop3, weeklyTop3DefaultProps } from './WeeklyTop3';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PriceComparison"
        component={PriceComparison}
        durationInFrames={345}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={priceComparisonDefaultProps}
      />
      <Composition
        id="WeeklyTop3"
        component={WeeklyTop3}
        durationInFrames={345}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={weeklyTop3DefaultProps}
      />
    </>
  );
};
