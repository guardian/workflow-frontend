# Headless X server + VNC for watching headed Playwright runs.
#
# Playwright/Chromium runs on the host, but the host dev container has no
# display. This image provides an in-container X server (Xvfb) that Chromium
# renders into over TCP (DISPLAY=<host>:0), a VNC server (x11vnc) attached to
# that display, and a noVNC web client (websockify) so the session can be
# viewed from a browser on the host. Only started for headed e2e runs.
FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        xvfb \
        x11vnc \
        novnc \
        websockify \
        x11-utils \
    && rm -rf /var/lib/apt/lists/*

COPY e2e/scripts/docker/start-x11vnc /usr/local/bin/start-x11vnc
RUN chmod +x /usr/local/bin/start-x11vnc

# 6000: X11 for display :0 (Chromium connects here over TCP).
# 5900: raw VNC.
# 6080: noVNC web client.
EXPOSE 6000 5900 6080

ENTRYPOINT ["/usr/local/bin/start-x11vnc"]
