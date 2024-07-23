// Originally taken from https://github.com/coatue-oss/react2angular
// We have copied this into the project directly rather than as a
// dependency in order to support our migration to React 18

import { IAugmentedJQuery, IComponentOptions } from 'angular'
import NgComponent from 'ngcomponent'
import * as React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'

/**
 * Wraps a React component in Angular. Returns a new Angular component.
 *
 * Usage:
 *
 *   ```ts
 *   type Props = { foo: number }
 *   class ReactComponent extends React.Component<Props, S> {}
 *   const AngularComponent = react2angular(ReactComponent, ['foo'])
 *   ```
 */
export function react2angular<Props>(
    Class: React.ComponentType<Props>,
    bindingNames: (keyof Props)[],
    injectNames: string[] = []
): IComponentOptions {
    return {
        bindings: Object.fromEntries(bindingNames.map(_ => [_, "<"])),
        controller: ['$element', ...injectNames, class extends NgComponent<Props> {
            static get $$ngIsClass() {
                return true
            }
            isDestroyed = false
            injectedProps: { [name: string]: any }
            constructor(private $element: IAugmentedJQuery, ...injectedProps: any[]) {
                super()
                this.injectedProps = {}
                injectNames.forEach((name, i) => {
                    this.injectedProps[name] = injectedProps[i]
                })
            }
            render() {
                if (!this.isDestroyed) {
                    render(
                        <Class {...this.props} {...this.injectedProps as any} />,
                        this.$element[0]
                    )
                }
            }
            componentWillUnmount() {
                this.isDestroyed = true
                unmountComponentAtNode(this.$element[0])
            }
        }]
    }
}
