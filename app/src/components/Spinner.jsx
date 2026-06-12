import mergeClasses from "@robit-dev/tailwindcss-class-combiner"

export default ({size="md"}) => {
	const sizes = {
		"xs" : "loading-xs",
		"sm" : "loading-sm",
		"md" : "loading-md",
		"lg" : "loading-lg",
		"xl" : "loading-xs"
	}
	return (
		<span  class={mergeClasses(`loading loading-bars`,sizes[size])}></span>
	);
};