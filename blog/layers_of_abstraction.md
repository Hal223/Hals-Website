# Emerging complexity from abstraction
`2025-06-10`
At the most fundamental level, a computer operates on the principle of presence or absence of an electrical charge, represented as 1s and 0s, or binary. This binary state is controlled by millions of microscopic transistors that act as switches. These switches are grouped together to form logic gates, which perform basic logical operations.

From there, layers of abstraction build upon each other to transform these simple on/off signals into the complex applications we use daily. First, machine code, the raw binary instructions a processor can execute, is created. This is then represented by a more human-readable assembly language.

Higher-level programming languages (like Python or Java) provide a further layer of abstraction, allowing developers to write instructions in a language closer to human language. These instructions are then compiled or interpreted back down into machine code. The operating system manages all of this, providing a crucial abstraction layer between the hardware and software. It allows applications to run without needing to know the specific details of the underlying hardware. Ultimately, every action on a computer, from moving a mouse to watching a video, is the result of these layers of abstraction translating complex human commands into the simple binary language of the machine.

## ASCII as Example 

I have always Found **the Best way to learn a new technology is to understand what problem it was designed to Solve.**

ASCII (American Standard Code for Information Interchange) is a perfect example of a fundamental layer of abstraction that turns binary 1s and 0s into readable characters. At its core, a computer only understands electrical signals representing on and off, or binary. To make these signals meaningful to humans, a standard like ASCII was created.

```txt
A  65  01000001
B  66  01000010
C  67  01000011
...  ...  ...
Z  90  01011010
a  97  01100001
b  98  01100010
c  99  01100011
...  ...  ...
z  122  01111010
0  48  00110000
1  49  00110001
2  50  00110010
...  ...  ...
9  57  00111001
!  33  00100001
?  63  00111111
```

## the TCP/IP and OSI Model

The models are a theoretical framework that divides network communication layers. they provide a structured way to understand and troubleshoot network issues by isolating different functions at each layer.

| Layer | OSI Model      | TCP/IP Model         |
|-------|----------------|----------------------|
|     1 | - Physical     |                      |
|     2 | - Data Link    | Network Access       |
|     - | -------------- | -------------------- |
|     3 | - Network      | Network              |
|     - | -------------- | -------------------- |
|     4 | -Transport     |                      |
|     5 | -Session       | Transport            |
|     6 | -Presentation  |                      |
|     - | -------------- | -------------------- |
|     7 | -Application   | Application          |

1.  Physical: This consists of a data connection between a device generating data and the network.
2. Datalink: The datalink layer is the point-to-point connection that transmits the data to the network layer.
3. Network: In the network layer, the data gets its address and routing instructions in preparation for its journey across the network.
4. Transport: In the transport layer, the data hops between different points on the network on its way to its destination.
5. Session: The session layer has a connection that manages the sessions happening between applications.
6. Presentation: The presentation layer is where data gets encrypted and decrypted and converted into a form that is accessible by the application layer,
7. Application: In the application layer, an application, such as an internet browser, gets the data and a user can then interact with it.

Now you have a understanding of this model you can use this to help narrow down trouble shooting. Lets say a user cant reach a website. we can pick a layer to test, for example layer 3. If we have the user ping their local gateway successfully we know that the lower levels (2 and 1) are good and no longer need to be troubleshot. we can repeat the process for the higher levels to narrow down the problem layer significantly reducing the amount of information needed to solve the issue.