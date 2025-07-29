declare module 'react-native-speedometer' {
  import { Component } from 'react';
  import { ViewStyle, TextStyle, ImageStyle, ImageSourcePropType } from 'react-native';

  export interface SpeedometerLabel {
    /**
     * The name/text to display for this label
     */
    name: string;

    /**
     * Color for the label text
     */
    labelColor: string;

    /**
     * Color for the active bar segment
     */
    activeBarColor: string;
  }

  export interface SpeedometerProps {
    /**
     * Current value to display on the speedometer (required)
     */
    value: number;
    
    /**
     * Default value for the speedometer
     */
    defaultValue?: number;
    
    /**
     * Size of the speedometer component
     */
    size?: number;
    
    /**
     * Minimum value for the speedometer scale
     */
    minValue?: number;
    
    /**
     * Maximum value for the speedometer scale
     */
    maxValue?: number;
    
    /**
     * Duration of the animation in milliseconds
     */
    easeDuration?: number;
    
    /**
     * Number of decimal places allowed for the value
     */
    allowedDecimals?: number;
    
    /**
     * Array of labels to display on the speedometer
     */
    labels?: SpeedometerLabel[];
    
    /**
     * Custom needle image source
     */
    needleImage?: ImageSourcePropType;
    
    /**
     * Style for the wrapper container
     */
    wrapperStyle?: ViewStyle;
    
    /**
     * Style for the outer circle
     */
    outerCircleStyle?: ViewStyle;
    
    /**
     * Style for the half circle
     */
    halfCircleStyle?: ViewStyle;
    
    /**
     * Style for the image wrapper
     */
    imageWrapperStyle?: ViewStyle;
    
    /**
     * Style for the needle image
     */
    imageStyle?: ImageStyle;
    
    /**
     * Style for the inner circle
     */
    innerCircleStyle?: ViewStyle;
    
    /**
     * Style for the label wrapper
     */
    labelWrapperStyle?: ViewStyle;
    
    /**
     * Style for the label text
     */
    labelStyle?: TextStyle;
    
    /**
     * Style for the label note text
     */
    labelNoteStyle?: TextStyle;
    
    /**
     * Whether to use native driver for animations
     */
    useNativeDriver?: boolean;
  }

  export default class Speedometer extends Component<SpeedometerProps> {}
}
