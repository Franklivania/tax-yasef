
export const getUserIP = async (): Promise<string | null> => {
  try {
    const localIP = await getLocalIPViaWebRTC();
    if (localIP) return localIP;
  } catch (error) {
    console.warn('WebRTC IP detection failed:', error);
  }

  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (!response.ok) throw new Error('Failed to fetch IP');
    const data = await response.json();
    return data.ip || null;
  } catch (error) {
    console.warn('Could not fetch IP address:', error);
    return null;
  }
};


const getLocalIPViaWebRTC = (): Promise<string | null> => {
  return new Promise((resolve) => {
    const RTCPeerConnection = 
      window.RTCPeerConnection ||
      (window as any).webkitRTCPeerConnection ||
      (window as any).mozRTCPeerConnection;

    if (!RTCPeerConnection) {
      resolve(null);
      return;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    const ips: string[] = [];
    const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g;

    pc.createDataChannel('');

    pc.onicecandidate = (event) => {
      if (!event.candidate) {
        pc.close();
        // Prefer IPv4, then IPv6
        const ipv4 = ips.find(ip => /^[0-9]/.test(ip));
        resolve(ipv4 || ips[0] || null);
        return;
      }

      const candidate = event.candidate.candidate;
      const match = candidate.match(ipRegex);
      if (match) {
        const ip = match[0];
        if (ips.indexOf(ip) === -1) {
          ips.push(ip);
        }
      }
    };

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch(() => resolve(null));

    // Timeout after 3 seconds
    setTimeout(() => {
      pc.close();
      const ipv4 = ips.find(ip => /^[0-9]/.test(ip));
      resolve(ipv4 || ips[0] || null);
    }, 3000);
  });
};


export const getUserBrowserInfo = () => {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  };
};