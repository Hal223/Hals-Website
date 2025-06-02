# Another Cool Idea: Dynamic Content

*Date: 2023-10-27*

Following up on [[my-first-post]], let's talk about dynamic content loading. This blog itself is an example!

## Markdown Rendering

These posts are written in Markdown (`.md`) and then fetched, parsed, and rendered as HTML on the fly using a library like `marked.js`. This allows for easy content creation.

### Internal Linking

The `[[post-slug]]` syntax you see is custom. After the Markdown is converted to HTML, I run a little script to find these patterns and turn them into actual links that open the corresponding blog post in a new "tab" within this editor interface.

For example, this links back to my first post: [[my-first-post]].

What do you think of this approach?


```js
    if (contentSectionsContainer) {
        contentSectionsContainer.addEventListener('scroll', () => {
            if (lineNumbersContainer && editorPane.classList.contains('mode-code')) {
                lineNumbersContainer.scrollTop = contentSectionsContainer.scrollTop;
            }
        });
    }
    
    // Initial setup
    ```