import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild('videoPreview', { static: false }) videoPreview?: ElementRef<HTMLVideoElement>;

  scanning = false;
  scanError = '';
  manualCode = '';
  readonly testInviteCode = 'dragonwars://invite/DEVTEST01';
  installVisible = false;
  installMessage = '';
  private deferredPrompt?: BeforeInstallPromptEvent;
  private cameraStream?: MediaStream;
  private scanTimeout?: number;
  private barcodeDetector?: any;

  constructor(private router: Router) {}

  ngOnInit() {
    window.addEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
    window.addEventListener('appinstalled', this.onAppInstalled);
  }

  ngOnDestroy() {
    this.stopScan();
    window.removeEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
    window.removeEventListener('appinstalled', this.onAppInstalled);
  }

  async openRoundRobin() {
    await this.startScan();
  }

  private async startScan() {
    this.scanError = '';
    this.scanning = true;

    if (!navigator.mediaDevices?.getUserMedia) {
      this.scanError = 'Camera is not available on this device.';
      return;
    }

    const Detector = (window as any).BarcodeDetector;
    if (!Detector) {
      this.scanError = 'QR scanning is not supported by this browser.';
      return;
    }

    try {
      this.barcodeDetector = new Detector({ formats: ['qr_code'] });
      this.cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });

      if (this.videoPreview?.nativeElement) {
        const video = this.videoPreview.nativeElement;
        video.srcObject = this.cameraStream;
        await video.play();
      }

      this.scanFrame();
    } catch (error) {
      console.error('QR scan start failed', error);
      this.scanError = 'Unable to access the camera. Please allow camera permissions.';
      this.scanning = false;
      this.stopScan();
    }
  }

  private async scanFrame() {
    if (!this.scanning || !this.barcodeDetector || !this.videoPreview?.nativeElement) {
      return;
    }

    try {
      const video = this.videoPreview.nativeElement;
      const barcodes = await this.barcodeDetector.detect(video);

      if (barcodes?.length) {
        const rawValue = barcodes[0]?.rawValue?.trim();
        if (rawValue && this.validateInvitationQr(rawValue)) {
          return this.completeScan();
        }

        this.scanError = 'Invalid tournament invitation QR code.';
      } else {
        this.scanError = '';
      }
    } catch (error) {
      console.warn('QR scan frame failed', error);
    } finally {
      this.scanTimeout = window.setTimeout(() => this.scanFrame(), 300);
    }
  }

  private validateInvitationQr(rawValue: string) {
    const inviteRegex = /^(?:dragonwars:\/\/invite\/|https?:\/\/(?:www\.)?(?:dragonwars\.com|dragon-wars\.io)\/invite\/)([A-Za-z0-9_-]{8,64})$/;
    return inviteRegex.test(rawValue.trim());
  }

  useManualCode(code?: string) {
    const inviteCode = (code ?? this.manualCode).trim();
    if (!inviteCode) {
      this.scanError = 'Enter an invite code or use the test invite button.';
      return;
    }

    if (this.validateInvitationQr(inviteCode)) {
      this.completeScan();
      return;
    }

    this.scanError = 'Invalid tournament invitation code.';
  }

  private async completeScan() {
    this.stopScan();
    this.router.navigate(['/round-robin']);
  }

  promptInstall = () => {
    if (!this.deferredPrompt) {
      this.installMessage = 'Install prompt is not available yet. Use your browser menu to add this app to your home screen if needed.';
      return;
    }

    this.deferredPrompt.prompt();
    this.deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA install prompt');
        this.installMessage = 'App install accepted. Enjoy Dragon Wars!';
      } else {
        console.log('User dismissed the PWA install prompt');
        this.installMessage = 'Install dismissed. You can try again later from the browser menu.';
      }
      this.deferredPrompt = undefined;
      this.installVisible = false;
    });
  };

  private onBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    this.deferredPrompt = event as BeforeInstallPromptEvent;
    this.installVisible = true;
    this.installMessage = 'Install is ready. Tap Install App to add Dragon Wars.';
  };

  private onAppInstalled = () => {
    this.installVisible = false;
    console.log('App installed successfully');
  };

  stopScan() {
    this.scanning = false;
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = undefined;
    }
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = undefined;
    }
  }
}
