import { describe, expect, it } from '@jest/globals';

import { directionsUrl } from '../directions';

const pont = { lat: 50.0865, lng: 14.4114, name: 'Pont Charles' };

describe('directionsUrl', () => {
  it('ouvre Plans à pied sur iPhone', () => {
    expect(directionsUrl(pont, 'ios')).toBe('https://maps.apple.com/?daddr=50.0865,14.4114&dirflg=w&q=Pont%20Charles');
  });

  it('ouvre Google Maps à pied sur Android', () => {
    expect(directionsUrl(pont, 'android')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=50.0865,14.4114&travelmode=walking',
    );
  });
});
