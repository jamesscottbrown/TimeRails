from z3 import *
import numpy as np

from copy import deepcopy


class RectangleSet:
    def __init__(self, dt, t_max):
        self.rectangles = {}  # hash, indexed by a (min_y, max_y) tuple
        self.num_times = 0
        self.num_rectangles = 0

        self.dt = dt
        self.t_max = t_max

        self.t0 = Real('t0')
        self.s = Solver()
        self.se = Solver()

        self.x = []

        self.thresholds = set()

    def get_time(self):
        self.num_times += 1
        t_new = Real('t_%s' % self.num_times)
        return t_new

    def add_constraint(self, constraint):
        self.s.add(constraint)

    def add_rectangle(self, start_time, length, min_y, max_y):

        if max_y is False:
            max_y = 30 # float('inf')
        else:
            self.thresholds.add(max_y)

        if min_y is False:
            min_y = -1  # float('-inf')
        else:
            self.thresholds.add(min_y)

        start_time_object = self.get_time()
        self.s.add(start_time_object == start_time)

        length_object = self.get_time()
        self.s.add(length_object == length)

        new_rectangle = Rectangle(start_time_object, length_object, length, min_y, max_y)

        if (min_y, max_y) not in self.rectangles.keys():
            self.rectangles[(min_y, max_y)] = []

        self.rectangles[(min_y, max_y)].append(new_rectangle)

        self.num_rectangles += 1

    def construct_overlapping_constraints(self):
        rect_positions = self.rectangles.keys()

        for i in range(0, len(rect_positions)):
            for j in range(i + 1, len(rect_positions)):

                rect_pos_1 = rect_positions[i]
                rect_pos_2 = rect_positions[j]

                # if top of one rectangle is above bottom of other, they overlap vertically
                if ((rect_pos_1[1] > rect_pos_2[0] and rect_pos_1[0] <= rect_pos_2[1])
                     or (rect_pos_2[1] > rect_pos_1[0] and rect_pos_2[0] <= rect_pos_1[1])):
                    continue

                # if don't overlap, add constraints between start of the corresponding rectangles
                for rect1 in self.rectangles[rect_positions[i]]:
                    for rect2 in self.rectangles[rect_positions[j]]:
                        # apply non-overlap condition
                        self.s.add(Or(rect2.start_time > rect1.end_time, rect2.end_time < rect1.start_time))

    def solve(self):
        if self.s.check() == unsat:
            print "FAILED"

        else:
            m = self.s.model()

            rect_lists = self.rectangles.values()
            for rect_list in rect_lists:
                for rect in rect_list:
                    rect.start_time_value = float(m[rect.start_time].as_decimal(5).replace('?', ''))
                    rect.length_value = float(m[rect.length].as_decimal(5).replace('?', ''))

    def get_axis_limits(self):
        thresholds = list(self.thresholds)
        if len(thresholds) == 0 or (len(thresholds) == 1 and thresholds[0]==0):
            y_min = -5
            y_max = +5
        elif len(thresholds) == 1:
            y_min = (1/5) * thresholds[0]
            y_max =  5 * thresholds[0]
        else:
            y_max = 2 * np.max(thresholds)
            y_min = (1/2) * np.min(thresholds)
        return y_min, y_max


    def draw(self):
        # must have called solve first!

        plot = plt.figure()
        ax = plot.add_subplot(111)
        ax.set_xlim([0, self.t_max])

        y_min, y_max = self.get_axis_limits()
        ax.set_ylim([y_min, y_max])

        # ax.set_ylim([-5, 20])

        rect_lists = self.rectangles.values()
        for rect_list in rect_lists:
            for rect in rect_list:
                height = rect.max_y - rect.min_y
                print "x=[%s,%s] y=[%s,%s]" % (rect.start_time_value, rect.start_time_value + rect.length_value,
                                               rect.min_y, rect.min_y + height)

                ax.add_patch(patches.Rectangle((rect.start_time_value, rect.min_y), rect.length_value, height))

        for level in self.thresholds:
            plt.plot((0, self.t_max), (level, level), 'k-')

            # plt.xlim([0, 100])

    def get_signal(self, plot=False):
        x = np.zeros((self.num_rectangles,))
        y = np.zeros((self.num_rectangles,))

        i = 0
        rect_lists = self.rectangles.values()
        for rect_list in rect_lists:
            for rect in rect_list:
                x[i] = rect.start_time_value + rect.length_value / 2
                y[i] = (rect.min_y + rect.max_y) / 2
                i += 1

        if plot:
            plt.figure()
            i = np.argsort(x)
            plt.plot(x[i], y[i], 'o-')

        return x, y

    # functions for showing how data meets specification
    def find_start_positions(self, x, gt, lt, duration):
        duration = int(duration)  # TODO: handle dt properly
        pos = []
        for i in range(0, len(x) - duration):
            if np.all(gt < x[i:i + duration + 1]) and np.all(x[i:i + duration + 1] < lt):
                pos.append(i)
        return pos

    def plot_start_positions(self, x, gt, lt, duration):
        pos = self.find_start_positions(x, gt, lt, duration)

        plot = plt.figure()
        ax = plot.add_subplot(111)

        for p in pos:
            ax.add_patch(patches.Rectangle((p, gt), duration, lt - gt, alpha=0.25))

        plt.plot(x)

    def get_animation_frame(self, x, time_object=False, time_value=False):
        # we already have a set of rectangles
        # just need to impose additional constraints

        # TODO: sampling rates
        # TODO: message if not satisfiable

        self.s2 = Solver()
        self.s2.add(self.s.assertions()) # create an actual copy

        if time_object is not False and time_value is not False:
            self.s2.add(time_object == time_value)

        self.x = x

        print len(self.rectangles.keys())

        for rect_position in self.rectangles.keys():

            for rectangle in self.rectangles[rect_position]:
                start_times = self.find_start_positions(x, rect_position[0], rect_position[1], rectangle.length_value)

                new_constraints = reduce(lambda a, b: Or(a, b), map(lambda t: (rectangle.start_time == t), start_times))
                self.s2.add(new_constraints)

        self.s2.check()

    def plot_animation_frame(self, t=False, ax=False):
        # must have called get_animation_frame
        #

        if ax is False:
            plot = plt.figure()
            ax = plot.add_subplot(111)
            ax.set_xlim([0, self.t_max])

        y_min, y_max = self.get_axis_limits()
        if np.min(self.x) < y_min:
            y_min = np.min(self.x)
        if np.max(self.x) > y_max:
            y_max = np.max(self.x)
        ax.set_ylim([y_min, y_max])

        m2 = self.s2.model()

        rect_lists = self.rectangles.values()
        for rect_list in rect_lists:
            for rect in rect_list:
                start_time_value = float(m2[rect.start_time].as_decimal(5).replace('?', ''))
                length_value = float(m2[rect.length].as_decimal(5).replace('?', ''))

                height = rect.max_y - rect.min_y
                print "Animated rect at x=[%s,%s] y=[%s,%s]" % (start_time_value, start_time_value + length_value,
                                                                rect.min_y, rect.min_y + height)
                ax.add_patch(patches.Rectangle((start_time_value, rect.min_y), length_value, height, alpha=0.25))

        for level in self.thresholds:
            plt.plot((0, self.t_max), (level, level), 'k-')

        plt.plot(self.x, 'o-')

        if t is not False:
            plt.axvline(x=t)
            plt.title("t = %s" % t)


class Rectangle:
    def __init__(self, start_time, length, length_value, min_y, max_y):
        self.start_time = start_time
        self.length = length
        self.length_value = length_value
        self.end_time = start_time + length

        self.min_y = min_y
        self.max_y = max_y

        if max_y < min_y:
            print "FUCK", max_y, min_y


class Inequality:
    def __init__(self, lt=False, gt=False):
        self.lt = lt
        if lt:
            self.lt = float(lt)

        self.gt = gt
        if gt:
            self.gt = float(gt)

    def generate_constraint(self, rectangle_set, start_time=0, start_time_object=False):
        # if this gets called, we have just an inequality with no temporal operators
        pass

    def holds_globally(self, duration, time_offset, rectangle_set):
        # we have a rectangle starting at time t, lasting time_offset
        rectangle_set.add_rectangle(time_offset, duration, self.gt, self.lt)

    def holds_finally(self, time_offset, rectangle_set):
        # we have a rectangle of zero width, starting before (time_offset + duration)
        rectangle_set.add_rectangle(time_offset, 0, self.gt, self.lt)


class Finally:
    def __init__(self, start_time, end_time, sub_term):
        self.start_time = start_time
        self.end_time = end_time
        self.sub_term = sub_term

    def generate_constraint(self, rectangle_set, start_time=0, start_time_object=False):
        t_new = rectangle_set.get_time()

        t_min = start_time + self.start_time
        rectangle_set.add_constraint(t_new >= t_min)

        t_max = start_time + self.end_time
        rectangle_set.add_constraint(t_new <= t_max)

        if isinstance(self.sub_term, Inequality):
            self.sub_term.holds_finally(t_new, rectangle_set)
        else:
            self.sub_term.generate_constraint(rectangle_set, t_new)


class Globally:
    def __init__(self, start_time, end_time, sub_term):
        self.start_time = start_time
        self.end_time = end_time
        self.sub_term = sub_term

    def generate_constraint(self, rectangle_set, start_time=0, start_time_object=False):
        if isinstance(self.sub_term, Inequality):
            duration = self.end_time - self.start_time
            self.sub_term.holds_globally(duration, self.start_time, rectangle_set) #start-time or self.start time, or sum?
        elif start_time_object is not False:
             self.sub_term.generate_constraint(rectangle_set, start_time_object)
             return self.start_time, self.end_time
        else:
            for t in np.arange(self.start_time, self.end_time, rectangle_set.dt):
                self.sub_term.generate_constraint(rectangle_set, t + start_time)


def solve_system(specifications, dt, t_max, draw=False):
    rectangle_set = RectangleSet(dt, t_max)

    for spec in specifications:
        spec.generate_constraint(rectangle_set, 0)

    rectangle_set.construct_overlapping_constraints()
    rectangle_set.solve()

    if draw:
        rectangle_set.draw()

    return rectangle_set

    # TODO: impose t_max constraints


def animate_system(specifications, dt, t_max, x):
    for spec in specifications:
        rectangle_set = RectangleSet(dt, t_max)
        time_object = rectangle_set.get_time()
        start_time, end_time = spec.generate_constraint(rectangle_set, 0, time_object)

        for t in np.arange(start_time, end_time):
            rectangle_set.get_animation_frame(x, time_object=time_object, time_value=t)
            rectangle_set.plot_animation_frame(t)


def actual_animate_system(specs, dt, t_max, max_start_time, x, separate=True):
    animations = []

    if separate:
        for spec in specs:
            anim = actual_animate_constraint([spec], dt, t_max, max_start_time, x)
            animations.append(anim)
            HTML(anim.to_html5_video())  # for some reason, in IPythion notebook, commenting this out breaks things
    else:
        anim = actual_animate_constraint(specs, dt, t_max, max_start_time, x)
        animations.append(anim)

    return animations


def actual_animate_constraint(specs, dt, t_max, max_start_time, x):
    fig = plt.figure()
    ax = plt.axes(xlim=(0, 40), ylim=(-2, 2))
    line, = ax.plot([], [], lw=2)

    def init():
        return line,

    def inner_animate_system(t):
        rectangle_set = RectangleSet(dt, t_max)
        time_object = rectangle_set.get_time()

        for spec in specs:
            start_time, end_time = spec.generate_constraint(rectangle_set, 0, time_object)

        plt.cla()
        rectangle_set.get_animation_frame(x, time_object=time_object, time_value=t)
        rectangle_set.plot_animation_frame(t=t, ax=ax)

        return line,  # ???

    anim = animation.FuncAnimation(fig, inner_animate_system, init_func=init,
                                   frames=max_start_time, interval=dt, blit=True)

    return anim


def parse_spec_string(string):
    string = string.lower().strip()

    if string.startswith("globally"):
        args = string[9:-1]
        parts = args.split(',')

        start = float(parts[0])
        end = float(parts[1])
        child = ','.join(parts[2:])

        return Globally(start, end, parse_spec_string(child))

    elif string.startswith("finally"):
        args = string[8:-1]
        parts = args.split(',')

        start = float(parts[0])
        end = float(parts[1])
        child = ','.join(parts[2:])

        return Finally(start, end, parse_spec_string(child))

    elif string.startswith("inequality"):
        args = string[11:-1]
        parts = args.split(',')

        args = {}
        for part in parts:
            part = part.strip()
            arg_name, value = part.split('=')
            args[arg_name] = value

        return Inequality(**args)


def parse_spec_strings(strings):
    specs = []
    for string in strings:
        specs.append(parse_spec_string(string))
    return specs