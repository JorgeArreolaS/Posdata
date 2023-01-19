import { IndexRouteProps, LayoutRouteProps, PathRouteProps } from "react-router-dom"

type RouteProps = PathRouteProps | LayoutRouteProps | IndexRouteProps
type Props = RouteProps & {
  component: () => JSX.Element
}

function setupRoute (_props: Props): RouteProps;
function setupRoute (_props: string, _component: () => JSX.Element): RouteProps;
function setupRoute (_props: any | string, _component?: any): RouteProps {
  const props: Props = typeof _props !== "string" ? _props : {
    path: _props,
    component: _component
  }


  if(props.component){
    const Component = props.component
    props.element = <Component/>
  }

  return props
}

export { setupRoute }
