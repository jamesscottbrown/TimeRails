#Docker file for local building and serving only
FROM ubuntu:14.04
MAINTAINER James Scott-Brown <james@jamesscottbrown.com>

RUN useradd vse-user

RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get install -y git python binutils g++ make sqlite3 python-pip

RUN git clone https://github.com/Z3Prover/z3.git
RUN cd z3; git checkout 596652ed
RUN cd z3; python scripts/mk_make.py --python
RUN cd z3/build; make; make install

RUN pip install --upgrade pip

ADD . /code
WORKDIR /code
RUN pip install -r requirements/dev.txt

USER vse-user
ENV FLASK_APP=/code/autoapp.py
ENV FLASK_DEBUG=1

CMD flask run --host=0.0.0.0