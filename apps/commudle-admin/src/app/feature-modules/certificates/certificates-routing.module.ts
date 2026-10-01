import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/certificate-batches-list/certificate-batches-list.component').then(
        (m) => m.CertificateBatchesListComponent,
      ),
  },
  {
    path: ':batch_uuid',
    loadComponent: () =>
      import('./components/certificate-batch-detail/certificate-batch-detail.component').then(
        (m) => m.CertificateBatchDetailComponent,
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CertificatesRoutingModule {}
