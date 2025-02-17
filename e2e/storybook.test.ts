import {
  forEachCli,
  runCLI,
  supportUi,
  uniq,
  ensureProject,
  tmpProjPath
} from './utils';
import { writeFileSync } from 'fs';

forEachCli(() => {
  describe('Storybook schematics', () => {
    if (supportUi()) {
      describe('running Storybook and Cypress', () => {
        it('should execute e2e tests using Cypress running against Storybook', () => {
          ensureProject();

          const myapp = uniq('myapp');
          runCLI(`generate @nrwl/angular:app ${myapp} --no-interactive`);

          const mylib = uniq('test-ui-lib');
          createTestUILib(mylib);

          const mylib2 = uniq('test-ui-lib-react');
          runCLI(`generate @nrwl/react:lib ${mylib2} --no-interactive`);
          runCLI(
            `generate @nrwl/react:component TestComponent --project=${mylib2} --no-interactive`
          );

          runCLI(
            `generate @nrwl/angular:storybook-configuration ${mylib} --configureCypress --generateStories --generateCypressSpecs --no-interactive`
          );
          runCLI(
            `generate @nrwl/storybook:configuration ${mylib} --no-interactive`
          );

          writeFileSync(
            tmpProjPath(
              `apps/${mylib}-e2e/src/integration/test-button/test-button.component.spec.ts`
            ),
            `
            describe('test-ui-lib3726865', () => {

              it('should render the component', () => {
                cy.visit('/iframe.html?id=testbuttoncomponent--primary&knob-buttonType=button&knob-style=default&knob-age&knob-isDisabled=false');
                cy.get('proj-test-button').should('exist');
                cy.get('button').should('not.be.disabled');
                cy.get('button').should('have.class', 'default');
                cy.contains('You are 0 years old.');
              });
              it('should adjust the knobs', () => {
                cy.visit('/iframe.html?id=testbuttoncomponent--primary&knob-buttonType=button&knob-style=primary&knob-age=10&knob-isDisabled=true');
                cy.get('button').should('be.disabled');
                cy.get('button').should('have.class', 'primary');
                cy.contains('You are 10 years old.');
              });
            });
            `
          );

          runCLI(
            `generate @nrwl/react:storybook-configuration ${mylib2} --configureCypress --no-interactive`
          );

          expect(
            runCLI(`run ${mylib}-e2e:e2e --configuration=headless --no-watch`)
          ).toContain('All specs passed!');
        }, 1000000);
      });
    }
  });
});

export function createTestUILib(libName: string): void {
  runCLI(`g @nrwl/angular:library ${libName} --no-interactive`);
  runCLI(
    `g @schematics/angular:component test-button --project=${libName} --no-interactive`
  );

  writeFileSync(
    tmpProjPath(`libs/${libName}/src/lib/test-button/test-button.component.ts`),
    `
import { Component, OnInit, Input } from '@angular/core';

export type ButtonStyle = 'default' | 'primary' | 'accent';

@Component({
  selector: 'proj-test-button',
  templateUrl: './test-button.component.html',
  styleUrls: ['./test-button.component.css']
})
export class TestButtonComponent implements OnInit {
  @Input('buttonType') type = 'button';
  @Input() style: ButtonStyle = 'default';
  @Input() age: number;
  @Input() isDisabled = false;

  constructor() { }

  ngOnInit() {
  }

}
      `
  );

  writeFileSync(
    tmpProjPath(
      `libs/${libName}/src/lib/test-button/test-button.component.html`
    ),
    `
    <button [disabled]="isDisabled" [attr.type]="type" [ngClass]="style">Click me</button>
    <p>You are {{age}} years old.</p>
    `
  );
  runCLI(
    `g @schematics/angular:component test-other --project=${libName} --no-interactive`
  );
}
