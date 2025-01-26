this_makefile=$(lastword $(MAKEFILE_LIST))

all: main.exe
	ls
	./main.exe
	$(MAKE) -f $(this_makefile) clean

main.exe: libhello.a
	$(CXX) main.cpp -o main.exe -lhello -L.

libhello.a: hello.o
	$(AR) rcs libhello.a hello.o

hello.o: hello.h hello.cpp
	$(CXX) -c hello.cpp -o hello.o

clean:
	rm -f *.o *.a *.exe
