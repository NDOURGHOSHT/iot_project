from flask import Flask
from route.main import main_bp
from route.api import api_bp
from route.errors import errors_bp
from route.controls import controls_bp
from route.settings import settings_bp
from route.alerts import alerts_bp
from route.gallery import gallery_bp
from zeroconf import ServiceInfo, Zeroconf
import socket

app = Flask(__name__)

app.register_blueprint(main_bp)
app.register_blueprint(api_bp)
app.register_blueprint(errors_bp)
app.register_blueprint(controls_bp)
app.register_blueprint(settings_bp)
app.register_blueprint(alerts_bp)
app.register_blueprint(gallery_bp)

def start_mdns():
    ip = socket.gethostbyname(socket.gethostname())
    info = ServiceInfo(
        "_http._tcp.local.",
        "poulailler._http._tcp.local.",
        addresses=[socket.inet_aton(ip)],
        port=5000,
    )
    zeroconf = Zeroconf()
    zeroconf.register_service(info)
    print(f"mDNS enregistré : poulailler.local → {ip}")

if __name__ == '__main__':
    start_mdns()  # ← ajouté
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)