import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IEvent } from 'apps/shared-models/event.model';
import { IEventSponsorGroupedByTierName } from 'apps/shared-models/event_sponsor.model';
import { EventSponsorsService } from 'apps/commudle-admin/src/app/services/event-sponsors.service';
import {
  ILogoTint,
  LogoTintService,
  onSponsorStripGradientEnter,
  onSponsorStripGradientLeave,
  onSponsorStripGradientMove,
} from '@commudle/shared-services';
import { faLink, faSackDollar } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-sponsors',
  templateUrl: './sponsors.component.html',
  styleUrls: ['./sponsors.component.scss'],
  standalone: false,
})
export class SponsorsComponent implements OnInit {
  @Input() event: IEvent;
  @Output() hasSponsors = new EventEmitter();

  eventSponsorGroupedByTierName: IEventSponsorGroupedByTierName;
  sponsorLogoTints: Record<number, ILogoTint> = {};

  icons = {
    faSackDollar,
    faLink,
  };

  onSponsorStripGradientEnter = onSponsorStripGradientEnter;
  onSponsorStripGradientMove = onSponsorStripGradientMove;
  onSponsorStripGradientLeave = onSponsorStripGradientLeave;

  constructor(private eventSponsorsService: EventSponsorsService, private logoTintService: LogoTintService) {}

  ngOnInit() {
    this.getSponsors();
  }

  getSponsors() {
    this.eventSponsorsService.pIndex(this.event.slug).subscribe((data) => {
      this.eventSponsorGroupedByTierName = data;
      if (Object.values(data ?? {}).flat().length > 0) {
        this.hasSponsors.emit(true);
      }
      this.resolveSponsorLogoTints();
    });
  }

  private resolveSponsorLogoTints(): void {
    const sponsors = Object.values(this.eventSponsorGroupedByTierName ?? {}).flat();
    if (!sponsors.length) {
      return;
    }

    this.logoTintService
      .resolveTints(
        sponsors.map((eventSponsor) => ({
          id: eventSponsor.id,
          logo: { logo_image: eventSponsor.sponsor.logo },
        })),
      )
      .then((tints) => {
        this.sponsorLogoTints = tints;
      });
  }
}
